# turunan

Bot Telegram + Google Sheets untuk pohon keluarga (family tree): catat orang, relasi orang tua-anak, pasangan, dan tampilkan leluhur/keturunan/pohon.

## Struktur Google Sheet

| Tab | Kolom |
|---|---|
| `Setting` | `kunci, nilai, tipe, keterangan` |
| `Orang` | `id_person, nama, jenis_kelamin, tanggal_lahir, tanggal_wafat, status, no_hp, alamat, catatan, dibuat_pada, dibuat_oleh` |
| `OrangTuaAnak` | `id_relasi, id_orangtua, id_anak, jenis, catatan` |
| `Pasangan` | `id_pasangan, id_suami, id_istri, tanggal_nikah, tanggal_cerai, status, catatan` |
| `TelegramUser` | `id_telegram, username, nama, id_person, peran, status, diminta_pada, diverifikasi_oleh, diverifikasi_pada` |
| `Pengumuman` | `timestamp, kategori, isi, pengirim` |

## Inisialisasi
Jalankan `initSheets()` di editor Apps Script.

## Perintah
Lihat main.gs / userHandlers.gs / adminHandlers.gs. Perintah warga: `/start /cari /orang /orangtua /anak /pasangan /saudara /leluhur /keturunan /pohon /stat /gabung /saya /pengumuman`. Admin: `/tambahorang /editorang /hubungkananak /copotorang /nikah /cerai /hapusorang /daftar /verifikasi /tolak /cabut /buatpengumuman /admin /setting /set`.

## Simulasi lokal
```bash
node simulate.js "/start"
node simulate.js "/orang P-001"
```

## Test
```bash
npm install
npm test
```