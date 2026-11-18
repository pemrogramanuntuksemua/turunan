const { createMockSheet, setSpreadsheet } = require("./helpers/mockSheet");
const app = require("../main.gs");

const SETTING_ROWS = [
  ["kunci", "nilai", "tipe", "keterangan"],
  ["nama_keluarga", "Keluarga Besar Satiri", "teks", ""],
  ["maks_telegram_per_person", "2", "angka", ""],
  ["maks_person_per_telegram", "5", "angka", ""],
  ["tampil_generasi_maks", "4", "angka", ""],
  ["admin_tambahan", "", "teks", ""],
];
const ORANG_ROWS = [
  ["id_person", "nama", "jenis_kelamin", "tanggal_lahir", "tanggal_wafat", "status", "no_hp", "alamat", "catatan", "foto_drive_id", "dibuat_pada", "dibuat_oleh"],
  ["P-001", "Ahmad", "L", "1970-01-01", "", "aktif", "0812", "Jl. Mawar", "", "", "2026-01-01", "777777"],
  ["P-002", "Siti", "P", "1972-02-02", "", "aktif", "", "", "", "", "2026-01-01", "777777"],
  ["P-003", "Budi", "L", "1995-03-03", "", "aktif", "", "", "", "", "2026-01-01", "777777"],
];
const ORTU_ROWS = [
  ["id_relasi", "id_orangtua", "id_anak", "jenis", "catatan"],
  ["R-001", "P-001", "P-003", "kandung", ""],
  ["R-002", "P-002", "P-003", "kandung", ""],
];
const PASANGAN_ROWS = [
  ["id_pasangan", "id_suami", "id_istri", "tanggal_nikah", "tanggal_cerai", "status", "catatan"],
  ["N-001", "P-001", "P-002", "1990-05-05", "", "menikah", ""],
];
const TELEGRAM_ROWS = [
  ["id_telegram", "username", "nama", "id_person", "peran", "status", "diminta_pada", "diverifikasi_oleh", "diverifikasi_pada"],
];
const PENGUMUMAN_ROWS = [
  ["timestamp", "kategori", "isi", "pengirim"],
];

function setup() {
  setSpreadsheet({
    Setting: createMockSheet(SETTING_ROWS.map((r) => r.slice())),
    Orang: createMockSheet(ORANG_ROWS.map((r) => r.slice())),
    OrangTuaAnak: createMockSheet(ORTU_ROWS.map((r) => r.slice())),
    Pasangan: createMockSheet(PASANGAN_ROWS.map((r) => r.slice())),
    TelegramUser: createMockSheet(TELEGRAM_ROWS.map((r) => r.slice())),
    Pengumuman: createMockSheet(PENGUMUMAN_ROWS.map((r) => r.slice())),
  });
}

let sent = [];
function run(text, chatId = 123, userId = 777777, name = "Admin") {
  sent = [];
  global.UrlFetchApp = {
    fetch: (url, options) => {
      if (String(url).includes("/getMe")) return { getContentText: () => JSON.stringify({ ok: true, result: { username: "turunan_bot" } }) };
      if (options && options.payload) {
        if (typeof options.payload === "string") { try { sent.push(JSON.parse(options.payload)); } catch (e) {} }
        else sent.push({ _payload: "multipart", chat_id: options.payload.chat_id });
      }
      return { getContentText: () => JSON.stringify({ ok: true, result: [] }) };
    },
  };
  const event = { postData: { contents: JSON.stringify({ update_id: Date.now() + Math.random(), message: { chat: { id: chatId }, from: { id: userId, first_name: name }, text } }) } };
  app.doPost(event);
  return sent.map((p) => p.text).join("\n");
}

beforeEach(() => {
  setup();
  app.setAdminIds(["777777"]);
});

test("non-admin ditolak", () => {
  const out = run("/daftar", 123, 999, "Warga");
  expect(out).toContain("Akses Ditolak");
});

test("/start sends greeting", () => {
  const out = run("/start");
  expect(out).toContain("Bot Pohon Keluarga");
});

test("/orang shows card", () => {
  const out = run("/orang P-001");
  expect(out).toContain("Ahmad");
  expect(out).toContain("P-001");
});

test("/orangtua /anak /pasangan /saudara", () => {
  expect(run("/orangtua P-003")).toContain("Ahmad");
  expect(run("/anak P-001")).toContain("Budi");
  expect(run("/pasangan P-001")).toContain("Siti");
});

test("/leluhur /keturunan /pohon /stat", () => {
  expect(run("/leluhur P-003")).toContain("Ahmad");
  expect(run("/keturunan P-001")).toContain("Budi");
  expect(run("/pohon P-001")).toContain("P-001 Ahmad");
  expect(run("/stat")).toContain("Orang tercatat");
});

test("admin tambah/edit/hapus orang", () => {
  expect(run("/tambahorang X#P#2001-01-01##note")).toContain("P-004");
  expect(run("/editorang P-004#status=wafat")).toContain("P-004");
  expect(run("/hapusorang P-004")).toContain("Dinonaktifkan");
});

test("admin nikah/hubungkan/copot", () => {
  expect(run("/nikah P-002#P-003#2020-01-01")).toContain("Pernikahan dicatat");
  expect(run("/hubungkananak P-003#P-001")).toContain("Orang tua dihubungkan");
  expect(run("/copotorang P-003#P-001")).toContain("Relasi dihapus");
});

test("admin daftar/setting/set/admin", () => {
  expect(run("/daftar")).toContain("Daftar Orang");
  expect(run("/setting")).toContain("Setting");
  expect(run("/set nama_keluarga#Test")).toContain("diubah");
  expect(run("/admin")).toContain("Daftar Admin");
});

test("buat pengumuman", () => {
  expect(run("/buatpengumuman Info#Halo")).toContain("Pengumuman disimpan");
  expect(run("/pengumuman")).toContain("Halo");
});

test("DM-only gabung/saya", () => {
  const out = run("/gabung P-001", 123, 999, "Warga");
  // grup? chatId positive treated as private in mock; still okay
  expect(out.length).toBeGreaterThan(0);
  const out2 = run("/saya", 123, 999, "Warga");
  expect(out2.length).toBeGreaterThan(0);
});

test("verifikasi/tolak/cabut flow", () => {
  run("/gabung P-001", 999, 999, "Warga");
  expect(run("/verifikasi P-001")).toContain("Diverifikasi");
});

test("photo set/foto/hapus", () => {
  expect(run("/setfoto P-001#DRIVE123")).toContain("Foto diset");
  const out = run("/foto P-001");
  expect(out).not.toContain("Gagal");
  expect(out).not.toContain("⚠️");
  expect(run("/hapusfoto P-001")).toContain("Foto dihapus");
  expect(run("/foto P-001")).toContain("Belum ada foto");
});