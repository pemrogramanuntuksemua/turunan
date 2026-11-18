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
  ["P-004", "Rina", "P", "1998-04-04", "", "aktif", "", "", "", "", "2026-01-01", "777777"],
];

const ORTU_ROWS = [
  ["id_relasi", "id_orangtua", "id_anak", "jenis", "catatan"],
  ["R-001", "P-001", "P-003", "kandung", ""],
  ["R-002", "P-002", "P-003", "kandung", ""],
  ["R-003", "P-001", "P-004", "kandung", ""],
  ["R-004", "P-002", "P-004", "kandung", ""],
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

beforeEach(() => setup());

test("getOrang returns all", () => {
  expect(app.getOrang()).toHaveLength(4);
});

test("cariOrang by id and name", () => {
  expect(app.cariOrang("P-001").nama).toBe("Ahmad");
  expect(app.cariOrang("Siti").id_person).toBe("P-002");
});

test("tambahOrang generates next id", () => {
  const o = app.tambahOrang({ nama: "X", jenis_kelamin: "L" }, "777777");
  expect(o.id_person).toBe("P-005");
  expect(app.getOrang()).toHaveLength(5);
});

test("ubahOrang updates fields", () => {
  const o = app.ubahOrang("P-001", { nama: "Ahmad2", jk: "L", status: "wafat" });
  expect(o.nama).toBe("Ahmad2");
  expect(o.status).toBe("wafat");
});

test("getOrangTua and getAnak", () => {
  expect(app.getOrangTua("P-003")).toHaveLength(2);
  expect(app.getAnak("P-001")).toHaveLength(2);
});

test("getSaudara", () => {
  const s = app.getSaudara("P-003").map((x) => x.id_person);
  expect(s).toContain("P-004");
});

test("ancestors and descendants", () => {
  const anc = app.ancestors("P-003", 2).map((x) => x.orang.id_person);
  expect(anc).toContain("P-001");
  expect(anc).toContain("P-002");
  const desc = app.descendants("P-001", 2).map((x) => x.orang.id_person);
  expect(desc).toContain("P-003");
  expect(desc).toContain("P-004");
});

test("nikah and cerai", () => {
  const n = app.nikah("P-003", "P-004", "2020-01-01");
  expect(n.id_pasangan).toBe("N-002");
  expect(app.getPasanganPerson("P-003")).toHaveLength(1);
  app.cerai(n.id_pasangan);
  const p = app.getPasanganRows().filter((x) => x.id_pasangan === n.id_pasangan)[0];
  expect(p.status).toBe("cerai");
});

test("ajukan/verifikasi/tolak/cabut keterkaitan", () => {
  app.setAdminIds(["777777"]);
  const hasil = app.ajukanKeterkaitan("999", "user", "Budi", "P-003");
  expect(hasil.status).toBe("menunggu");
  const v = app.verifikasiKeterkaitan("P-003", "777777");
  expect(v.status).toBe("aktif");
  expect(app.getPersonTerhubung("999")).toHaveLength(1);
  const rows = app.cabutKeterkaitan("P-003", "777777");
  expect(rows).toHaveLength(1);
});

test("tolak keterkaitan", () => {
  app.ajukanKeterkaitan("888", "u2", "Rina", "P-004");
  const t = app.tolakKeterkaitan("P-004", "777777");
  expect(t.status).toBe("ditolak");
});