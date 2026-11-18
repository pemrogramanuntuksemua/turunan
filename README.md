# Turunan

Bot Telegram + Google Sheets untuk pohon keluarga (family tree): catat orang, relasi orang tua–anak, pasangan, leluhur, dan keturunan.

## Prasyarat

- Node.js + npm (untuk unit test)
- Akun Google (Google Sheets + Google Apps Script)
- Bot Telegram (token dari [@BotFather](https://t.me/BotFather))

## Konfigurasi

Isi konstanta di bagian atas `main.gs`:

- `SPREADSHEET_ID` — ID Google Spreadsheet
- `TELEGRAM_TOKEN` — token bot Telegram
- `WEBHOOK_URL` — URL deploy Web App (diisi setelah deploy)
- `ADMIN_IDS` — array ID Telegram pengurus inti
- `GROUP_CHAT_ID` (opsional) — ID grup untuk auto-broadcast pengumuman

## Struktur Google Sheet

Semua tab dibuat otomatis oleh `initSheets()` / `setupSheets()`.

| Tab | Kolom |
|---|---|
| `Setting` | `kunci, nilai, tipe, keterangan` |
| `Orang` | `id_person, nama, jenis_kelamin, tanggal_lahir, tanggal_wafat, status, no_hp, alamat, catatan, foto_drive_id, dibuat_pada, dibuat_oleh` |
| `OrangTuaAnak` | `id_relasi, id_orangtua, id_anak, jenis, catatan` |
| `Pasangan` | `id_pasangan, id_suami, id_istri, tanggal_nikah, tanggal_cerai, status, catatan` |
| `TelegramUser` | `id_telegram, username, nama, id_person, peran, status, diminta_pada, diverifikasi_oleh, diverifikasi_pada` |
| `Pengumuman` | `timestamp, kategori, isi, pengirim` |

### Aturan data

- **Orang** adalah unit utama (node pohon). `id_person` format `P-001`.
- **Relasi orang tua–anak** disimpan di `OrangTuaAnak`. Satu anak bisa punya 0–2 orang tua; jenis: `kandung`, `angkat`, `tiri`.
- **Pernikahan** disimpan di `Pasangan` (status: `menikah`, `cerai`, `wafat`).
- **Saudara** tidak disimpan eksplisit, diturunkan dari kesamaan orang tua.
- **Status orang**: `aktif`, `wafat`, `nonaktif` (soft-delete via nonaktif).
- **Foto**: disimpan sebagai ID file Google Drive di kolom `foto_drive_id`. Bot mengirim foto dengan mengambil blob dari Drive. Perintah `/foto` terpisah dari kartu teks.
- **Keterkaitan Telegram ↔ Orang** disimpan di `TelegramUser`. Status: `menunggu`, `aktif`, `ditolak`, `dicabut`. Baris `ditolak`/`dicabut` dipakai ulang saat mengajukan lagi.
- Kuota: `maks_telegram_per_person` (default 2) dan `maks_person_per_telegram` (default 5); nilai `0` = tanpa batas.

## Inisialisasi & reset

Perintah ini dijalankan dari editor Apps Script, bukan lewat bot.

| Fungsi | Kegunaan |
|---|---|
| `setupSheets({ mode: "safe" })` / `initSheets()` | Membuat tab yang belum ada, mengisi setting awal. Data lama aman. |
| `setupSheets({ mode: "reset", dryRun: true })` | Melihat rencana reset tanpa mengubah apa pun. |
| `setupSheets({ mode: "reset", backup: true })` | Backup file ke Drive, lalu hapus & buat ulang tab skema. |
| `setupSheets({ mode: "fresh", backup: true })` | Sama seperti reset, tetapi juga menghapus `Pengumuman`. |

## Cara deploy webhook

1. Deploy `main.gs`/`core.gs`/`userHandlers.gs`/`adminHandlers.gs` sebagai Web App di Google Apps Script.
2. Jalankan `setWebhook()` atau set manual via URL Telegram.
3. Uji endpoint: buka URL `/exec` di browser (harus tampil `OK`).

## Polling (alternatif webhook)

1. Jalankan `setupPollingTrigger()` di Apps Script (trigger tiap 1 menit, menonaktifkan webhook).
2. Untuk menghentikan: `stopPollingTrigger()`.

## Daftar perintah

### Untuk semua warga

| Perintah | Keterangan | Contoh |
|---|---|---|
| `/start` | Sambutan & daftar perintah | `/start` |
| `/cari <nama/id>` | Cari orang | `/cari Ahmad` |
| `/orang <id>` | Kartu orang + relasi | `/orang P-001` |
| `/orangtua <id>` | Orang tua | `/orangtua P-003` |
| `/anak <id>` | Daftar anak | `/anak P-001` |
| `/pasangan <id>` | Pasangan | `/pasangan P-001` |
| `/saudara <id>` | Saudara | `/saudara P-003` |
| `/leluhur <id> [level]` | Leluhur | `/leluhur P-003 3` |
| `/keturunan <id> [level]` | Keturunan | `/keturunan P-001 3` |
| `/pohon <id> [level]` | Tampilan pohon teks | `/pohon P-001 4` |
| `/stat` | Statistik | `/stat` |
| `/gabung <id>` | Hubungkan akun (DM only) | `/gabung P-001` |
| `/saya` | Cek keterkaitan (DM only) | `/saya` |
| `/pengumuman` | 5 pengumuman terbaru | `/pengumuman` |
| `/foto <id>` | Kirim foto orang dari Google Drive | `/foto P-001` |

### Khusus pengurus (`ADMIN_IDS`)

| Perintah | Keterangan | Contoh |
|---|---|---|
| `/tambahorang Nama#L/P#[lahir]#[wafat]#catatan` | Tambah orang | `/tambahorang Budi#L#1990-01-01##` |
| `/editorang id#field=nilai` | Ubah data orang | `/editorang P-001#jk=L#status=aktif` |
| `/hubungkananak id_anak#id_ortu1#[id_ortu2]#[jenis]` | Set orang tua anak | `/hubungkananak P-003#P-001#P-002#kandung` |
| `/copotorang id_anak#id_ortu` | Lepas relasi orang tua | `/copotorang P-003#P-001` |
| `/nikah id1#id2#[tanggal]` | Catat pernikahan | `/nikah P-001#P-002#1990-05-05` |
| `/cerai id_pasangan` | Tandai cerai | `/cerai N-001` |
| `/hapusorang id` | Nonaktifkan orang | `/hapusorang P-005` |
| `/setfoto id_person#driveFileId` | Simpan ID file foto di Google Drive | `/setfoto P-001#1AbC...` |
| `/hapusfoto id_person` | Hapus referensi foto | `/hapusfoto P-001` |
| `/daftar [filter]` | Daftar orang | `/daftar` |
| `/verifikasi <id_person/id_telegram>` | Setujui keterkaitan | `/verifikasi P-001` |
| `/tolak <id_person/id_telegram>` | Tolak keterkaitan | `/tolak 123456789` |
| `/cabut <id_person/id_telegram>` | Putuskan keterkaitan | `/cabut P-001` |
| `/buatpengumuman Kategori#Isi` | Simpan & broadcast | `/buatpengumuman Info#Kerja bakti` |
| `/admin` | Daftar admin | `/admin` |
| `/admin tambah#id` / `/admin hapus#id` | Kelola admin tambahan (khusus inti) | `/admin tambah#123456789` |
| `/setting` | Daftar setting | `/setting` |
| `/set kunci#nilai` | Ubah setting | `/set nama_keluarga#Keluarga Besar` |

## Keterkaitan akun Telegram ↔ Orang

1. Warga mengirim `/gabung <id/nama>` lewat DM.
2. Sistem menulis baris `TelegramUser` berstatus `menunggu` dan memberi tahu admin.
3. Pengurus menjalankan `/verifikasi` atau `/tolak`.
4. Setelah `aktif`, warga bisa memakai `/saya` dan melihat detail orang terhubung.

### Privasi di grup

- `/gabung`, `/saya` hanya jalan di DM.
- `/orang` di grup hanya menampilkan kartu ringkas tanpa data kontak.
- Data `no_hp`/`alamat` hanya tampil untuk admin atau akun terhubung via DM.
- Foto hanya dapat diminta oleh admin atau akun terhubung; di grup bot menolak/mengarahkan ke DM.

## Struktur kode

- `core.gs` — infrastruktur bersama (spreadsheet, telegram, format, domain orang/relasi, keterkaitan akun, setup sheets, webhook/polling).
- `userHandlers.gs` — handler warga.
- `adminHandlers.gs` — handler pengurus.
- `main.gs` — konstanta, dispatch, `doPost/doGet`.

## Simulasi lokal

```bash
node simulate.js "/start"
node simulate.js "/orang P-001"
```

## Menjalankan unit test

```bash
npm install
npm test
# dengan coverage:
npm run test:coverage
```

## Troubleshooting

### Perintah tidak dibalas

1. Cek Apps Script → Executions/Logs untuk error.
2. Pastikan perintah dikirim tanpa suffix `@namabot`.
3. Pastikan deploy memakai URL `/exec`.

### Foto tidak terkirim

1. Pastikan `foto_drive_id` berisi ID file Drive yang valid.
2. Pastikan file Drive bisa diakses (minimal "Anyone with link" atau dimiliki akun bot).
3. Format foto yang didukung Telegram (jpg/png). Cek log Apps Script untuk error Drive/Telegram.

### Pending updates tidak turun

1. Jalankan `setWebhook(true)` atau `deleteWebhook(true)` lalu `setWebhook()`.
2. Set Script Property `ACK_ONLY=true` untuk debug ACK-only, lalu kembalikan `false`.
3. Health check: buka URL Web App `/exec` → harus tampil `OK`.

## Alur contoh

1. Admin: `/tambahorang Ahmad#L#1970-01-01##`
2. Admin: `/tambahorang Siti#P#1972-02-02##`
3. Admin: `/tambahorang Budi#L#1995-03-03##`
4. Admin: `/nikah P-001#P-002#1990-05-05`
5. Admin: `/hubungkananak P-003#P-001#P-002#kandung`
6. Warga: `/gabung P-003` (DM) → admin `/verifikasi P-003`
7. Warga: `/orang P-001` / `/pohon P-001`