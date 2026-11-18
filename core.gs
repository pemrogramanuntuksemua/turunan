function str(v) { return v === null || v === undefined ? "" : String(v).trim(); }
function aman(fn) { try { fn(); } catch (e) {} }
function parseAngka(v) {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let s = str(v).replace(/[Rr]p\.?\s*/g, "").replace(/\s/g, "");
  if (!s) return 0;
  if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return isFinite(n) ? n : 0;
}
function toBool(v) {
  if (typeof v === "boolean") return v;
  const s = str(v).toLowerCase();
  return s === "true" || s === "1" || s === "ya" || s === "yes";
}
function parseTanggal(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  const s = str(v);
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function formatTanggal(v) {
  const d = parseTanggal(v);
  if (!d) return "-";
  return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
}
function pad2(n) { return String(n).padStart(2, "0"); }
function escMd(v) { return str(v).replace(/([_*`\[\]])/g, "\\$1"); }
function naturalCompare(a, b) {
  const ta = str(a).match(/(\d+|\D+)/g) || [];
  const tb = str(b).match(/(\d+|\D+)/g) || [];
  const len = Math.max(ta.length, tb.length);
  for (let i = 0; i < len; i++) {
    const x = ta[i]; const y = tb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (/^\d+$/.test(x) && /^\d+$/.test(y)) {
      const nx = Number(x); const ny = Number(y);
      if (nx !== ny) return nx - ny;
    } else if (x.toLowerCase() !== y.toLowerCase()) {
      return x.toLowerCase() < y.toLowerCase() ? -1 : 1;
    }
  }
  return 0;
}
function padKanan(v, n) { let s = str(v); while (s.length < n) s += " "; return s; }
function padKiri(v, n) { let s = str(v); while (s.length < n) s = " " + s; return s; }

function getSpreadsheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}
function bacaTabel(nama) {
  const sheet = getSpreadsheet(nama);
  if (!sheet) return { sheet: null, header: [], rows: [] };
  const values = sheet.getDataRange().getValues();
  if (!values.length) return { sheet, header: [], rows: [] };
  const header = values[0].map((v) => str(v).toLowerCase());
  const skema = SHEET_SCHEMA[nama] || [];
  const rows = values.slice(1).map((raw, i) => {
    const obj = {};
    skema.forEach((kol, idx) => {
      const pos = header.indexOf(kol);
      obj[kol] = pos >= 0 ? raw[pos] : raw[idx];
    });
    obj._row = i + 2;
    obj._raw = raw;
    return obj;
  });
  return { sheet, header, rows };
}
function tambahBaris(nama, obj) {
  const sheet = getSpreadsheet(nama);
  if (!sheet) throw new Error("Tab '" + nama + "' belum dibuat. Jalankan initSheets().");
  const skema = SHEET_SCHEMA[nama] || Object.keys(obj);
  sheet.appendRow(skema.map((k) => (obj[k] === undefined || obj[k] === null ? "" : obj[k])));
}
function setSel(nama, baris, kolom, nilai) {
  const sheet = getSpreadsheet(nama);
  if (!sheet) throw new Error("Tab '" + nama + "' belum dibuat.");
  const skema = SHEET_SCHEMA[nama] || [];
  const idx = skema.indexOf(kolom);
  if (idx < 0) throw new Error("Kolom '" + kolom + "' tidak dikenal di " + nama + ".");
  sheet.getRange(baris, idx + 1).setValue(nilai);
}
function konversiNilai(nilai, tipe) {
  const t = str(tipe).toLowerCase();
  if (t === "angka") return parseAngka(nilai);
  if (t === "boolean") return toBool(nilai);
  if (t === "teks") return str(nilai);
  if (typeof nilai === "number") return nilai;
  if (typeof nilai === "boolean") return nilai;
  return str(nilai);
}

// Settings
function getSettings() {
  const hasil = {};
  Object.keys(DEFAULT_SETTINGS).forEach((k) => { hasil[k] = DEFAULT_SETTINGS[k].nilai; });
  bacaTabel(SHEET_SETTING).rows.forEach((r) => {
    const kunci = str(r.kunci);
    if (!kunci) return;
    const tipe = str(r.tipe) || (DEFAULT_SETTINGS[kunci] ? DEFAULT_SETTINGS[kunci].tipe : "");
    hasil[kunci] = konversiNilai(r.nilai, tipe);
  });
  return hasil;
}
function getSetting(kunci, fallback) {
  const semua = getSettings();
  if (Object.prototype.hasOwnProperty.call(semua, kunci)) return semua[kunci];
  return fallback === undefined ? "" : fallback;
}
function setSetting(kunci, nilai) {
  const kunciBersih = str(kunci);
  if (!kunciBersih) throw new Error("Kunci setting tidak boleh kosong.");
  const { rows } = bacaTabel(SHEET_SETTING);
  const ada = rows.filter((r) => str(r.kunci) === kunciBersih)[0];
  const def = DEFAULT_SETTINGS[kunciBersih];
  const tipe = def ? def.tipe : (typeof nilai === "number" ? "angka" : typeof nilai === "boolean" ? "boolean" : "teks");
  if (ada) {
    setSel(SHEET_SETTING, ada._row, "nilai", nilai);
    setSel(SHEET_SETTING, ada._row, "tipe", tipe);
    return nilai;
  }
  tambahBaris(SHEET_SETTING, { kunci: kunciBersih, nilai: nilai, tipe: tipe, keterangan: def ? def.keterangan : "" });
  return nilai;
}

// Admin
function getAdminTambahan() {
  const raw = str(getSetting("admin_tambahan", ""));
  return raw ? raw.split(",").map((x) => str(x)).filter(Boolean) : [];
}
function getAdminIds() {
  const hasil = [];
  ADMIN_IDS.concat(getAdminTambahan()).forEach((id) => {
    const v = str(id);
    if (v && hasil.indexOf(v) < 0) hasil.push(v);
  });
  return hasil;
}
function isAdmin(userId) { return getAdminIds().indexOf(str(userId)) >= 0; }
function isAdminInti(userId) { return ADMIN_IDS.map((id) => str(id)).indexOf(str(userId)) >= 0; }
function simpanAdminTambahan(ids) {
  const bersih = [];
  (ids || []).forEach((id) => { const v = str(id); if (v && bersih.indexOf(v) < 0) bersih.push(v); });
  setSetting("admin_tambahan", bersih.join(","));
  return bersih;
}
function setAdminIds(ids) { ADMIN_IDS.length = 0; if (Array.isArray(ids)) ids.forEach((id) => ADMIN_IDS.push(String(id))); }
function setGroupChatId(id) { GROUP_CHAT_ID = id ? String(id) : ""; }
function getGroupChatId() { return GROUP_CHAT_ID; }

function teksPerintah(text, cmd) {
  const s = str(text);
  if (s.toLowerCase().indexOf(cmd.toLowerCase()) !== 0) return "";
  return s.slice(cmd.length).trim();
}
function balas(chatId, teks) { sendTelegramMessage(chatId, teks); }
function balasError(chatId, error) { sendTelegramMessage(chatId, "⚠️ " + (error && error.message ? error.message : String(error))); }
function tolakAdmin(chatId) { sendTelegramMessage(chatId, "⛔ *Akses Ditolak!*\n\nPerintah ini khusus untuk Pengurus."); }

// ID generation
function generateIdPerson() {
  const lock = LockService.getScriptLock();
  let locked = false;
  aman(() => { locked = lock.tryLock(10000); });
  try {
    let max = 0;
    getOrang().forEach((o) => {
      const m = str(o.id_person).match(/^P-(\d+)$/i);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return "P-" + String(max + 1).padStart(3, "0");
  } finally {
    if (locked) aman(() => lock.releaseLock());
  }
}
function generateIdRelasi() {
  let max = 0;
  bacaTabel(SHEET_ORANGTUA_ANAK).rows.forEach((r) => {
    const m = str(r.id_relasi).match(/^R-(\d+)$/i);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return "R-" + String(max + 1).padStart(3, "0");
}
function generateIdPasangan() {
  let max = 0;
  bacaTabel(SHEET_PASANGAN).rows.forEach((r) => {
    const m = str(r.id_pasangan).match(/^N-(\d+)$/i);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return "N-" + String(max + 1).padStart(3, "0");
}

// Orang domain
function getOrang() {
  return bacaTabel(SHEET_ORANG).rows.map((o) => ({
    id_person: str(o.id_person),
    nama: str(o.nama),
    jenis_kelamin: str(o.jenis_kelamin).toUpperCase(),
    tanggal_lahir: str(o.tanggal_lahir),
    tanggal_wafat: str(o.tanggal_wafat),
    status: str(o.status) || "aktif",
    no_hp: str(o.no_hp),
    alamat: str(o.alamat),
    catatan: str(o.catatan),
    dibuat_pada: o.dibuat_pada,
    dibuat_oleh: str(o.dibuat_oleh),
    _row: o._row,
  })).filter((o) => o.id_person);
}
function getOrangAktif() { return getOrang().filter((o) => o.status.toLowerCase() === "aktif"); }
function cariOrang(identifier) {
  const key = str(identifier);
  if (!key) throw new Error("Identifier orang kosong.");
  const semua = getOrang();
  const up = key.toUpperCase();
  let found = semua.filter((o) => o.id_person.toUpperCase() === up);
  if (found.length === 1) return found[0];
  found = semua.filter((o) => o.nama.toUpperCase() === up);
  if (found.length === 1) return found[0];
  if (found.length > 1) throw new Error("'" + key + "' cocok dengan lebih dari satu orang. Gunakan id_person.");
  const partial = semua.filter((o) => o.nama.toUpperCase().indexOf(up) >= 0);
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) throw new Error("'" + key + "' cocok dengan lebih dari satu orang. Gunakan id_person.");
  throw new Error("Orang '" + key + "' tidak ditemukan.");
}
function tambahOrang(data, oleh) {
  const d = data || {};
  const nama = str(d.nama);
  if (!nama) throw new Error("Nama wajib diisi.");
  const id = generateIdPerson();
  const jk = str(d.jenis_kelamin).toUpperCase();
  const jkNorm = (jk === "L" || jk === "P") ? jk : "";
  tambahBaris(SHEET_ORANG, {
    id_person: id,
    nama: nama,
    jenis_kelamin: jkNorm,
    tanggal_lahir: str(d.tanggal_lahir),
    tanggal_wafat: str(d.tanggal_wafat),
    status: str(d.status) || "aktif",
    no_hp: str(d.no_hp),
    alamat: str(d.alamat),
    catatan: str(d.catatan),
    dibuat_pada: new Date(),
    dibuat_oleh: str(oleh),
  });
  return cariOrang(id);
}
function ubahOrang(idPerson, perubahan) {
  const o = cariOrang(idPerson);
  const d = perubahan || {};
  const punya = (k) => Object.prototype.hasOwnProperty.call(d, k);
  if (punya("nama")) {
    const nama = str(d.nama);
    if (!nama) throw new Error("Nama tidak boleh kosong.");
    setSel(SHEET_ORANG, o._row, "nama", nama);
  }
  if (punya("jk") || punya("jenis_kelamin")) {
    const v = normalizeJK(d.jk !== undefined ? d.jk : d.jenis_kelamin);
    setSel(SHEET_ORANG, o._row, "jenis_kelamin", v);
  }
  if (punya("lahir") || punya("tanggal_lahir")) {
    const v = (d.lahir !== undefined ? d.lahir : d.tanggal_lahir);
    setSel(SHEET_ORANG, o._row, "tanggal_lahir", str(v) === "-" ? "" : str(v));
  }
  if (punya("wafat") || punya("tanggal_wafat")) {
    const v = (d.wafat !== undefined ? d.wafat : d.tanggal_wafat);
    setSel(SHEET_ORANG, o._row, "tanggal_wafat", str(v) === "-" ? "" : str(v));
  }
  if (punya("status")) setSel(SHEET_ORANG, o._row, "status", str(d.status) || "aktif");
  if (punya("hp") || punya("no_hp")) setSel(SHEET_ORANG, o._row, "no_hp", str(d.hp !== undefined ? d.hp : d.no_hp));
  if (punya("alamat")) setSel(SHEET_ORANG, o._row, "alamat", str(d.alamat));
  if (punya("catatan")) setSel(SHEET_ORANG, o._row, "catatan", str(d.catatan) === "-" ? "" : str(d.catatan));
  return cariOrang(o.id_person);
}
function normalizeJK(v) {
  const s = str(v).toLowerCase();
  if (s === "l" || s === "laki-laki" || s === "laki laki" || s === "pria") return "L";
  if (s === "p" || s === "perempuan" || s === "wanita") return "P";
  return str(v).toUpperCase();
}

// Relasi orang tua - anak
function getRelasiOrtu() {
  return bacaTabel(SHEET_ORANGTUA_ANAK).rows.map((r) => ({
    id_relasi: str(r.id_relasi),
    id_orangtua: str(r.id_orangtua),
    id_anak: str(r.id_anak),
    jenis: str(r.jenis) || "kandung",
    catatan: str(r.catatan),
    _row: r._row,
  })).filter((r) => r.id_relasi && r.id_orangtua && r.id_anak);
}
function getOrangTua(idAnak) {
  const target = str(idAnak).toUpperCase();
  return getRelasiOrtu().filter((r) => r.id_anak.toUpperCase() === target);
}
function getAnak(idOrtu) {
  const target = str(idOrtu).toUpperCase();
  return getRelasiOrtu().filter((r) => r.id_orangtua.toUpperCase() === target);
}
function hubungkanAnak(idAnak, idOrtu1, idOrtu2, jenis) {
  const anak = cariOrang(idAnak);
  const ortu1 = cariOrang(idOrtu1);
  const daftar = [];
  const add = (idOrtu) => {
    const o = (idOrtu === idOrtu1) ? ortu1 : cariOrang(idOrtu);
    const ada = getRelasiOrtu().filter((r) => r.id_anak.toUpperCase() === anak.id_person.toUpperCase() && r.id_orangtua.toUpperCase() === o.id_person.toUpperCase());
    if (!ada.length) {
      tambahBaris(SHEET_ORANGTUA_ANAK, {
        id_relasi: generateIdRelasi(),
        id_orangtua: o.id_person,
        id_anak: anak.id_person,
        jenis: str(jenis) || "kandung",
        catatan: "",
      });
    }
    daftar.push(o);
  };
  add(idOrtu1);
  if (idOrtu2) add(idOrtu2);
  return daftar;
}
function copotOrang(idAnak, idOrtu) {
  const anak = cariOrang(idAnak);
  const ortu = cariOrang(idOrtu);
  const rows = getRelasiOrtu().filter((r) => r.id_anak.toUpperCase() === anak.id_person.toUpperCase() && r.id_orangtua.toUpperCase() === ortu.id_person.toUpperCase());
  rows.sort((a, b) => b._row - a._row).forEach((r) => {
    const sheet = getSpreadsheet(SHEET_ORANGTUA_ANAK);
    if (sheet) aman(() => sheet.deleteRow(r._row));
  });
  return rows.length;
}

// Pasangan
function getPasanganRows() {
  return bacaTabel(SHEET_PASANGAN).rows.map((r) => ({
    id_pasangan: str(r.id_pasangan),
    id_suami: str(r.id_suami),
    id_istri: str(r.id_istri),
    tanggal_nikah: str(r.tanggal_nikah),
    tanggal_cerai: str(r.tanggal_cerai),
    status: str(r.status) || "menikah",
    catatan: str(r.catatan),
    _row: r._row,
  })).filter((r) => r.id_pasangan);
}
function getPasanganPerson(idPerson) {
  const target = str(idPerson).toUpperCase();
  return getPasanganRows().filter((p) => p.id_suami.toUpperCase() === target || p.id_istri.toUpperCase() === target);
}
function nikah(id1, id2, tanggal) {
  const a = cariOrang(id1);
  const b = cariOrang(id2);
  if (a.id_person === b.id_person) throw new Error("Tidak bisa menikah dengan diri sendiri.");
  const id = generateIdPasangan();
  tambahBaris(SHEET_PASANGAN, {
    id_pasangan: id,
    id_suami: a.jenis_kelamin === "L" ? a.id_person : (b.jenis_kelamin === "L" ? b.id_person : a.id_person),
    id_istri: a.jenis_kelamin === "P" ? a.id_person : (b.jenis_kelamin === "P" ? b.id_person : b.id_person),
    tanggal_nikah: str(tanggal),
    tanggal_cerai: "",
    status: "menikah",
    catatan: "",
  });
  return getPasanganRows().filter((p) => p.id_pasangan === id)[0];
}
function cerai(idPasangan) {
  const key = str(idPasangan).toUpperCase();
  const p = getPasanganRows().filter((x) => x.id_pasangan.toUpperCase() === key)[0];
  if (!p) throw new Error("Pasangan '" + idPasangan + "' tidak ditemukan.");
  setSel(SHEET_PASANGAN, p._row, "status", "cerai");
  setSel(SHEET_PASANGAN, p._row, "tanggal_cerai", formatTanggal(new Date())); // store as date string? okay
  return p;
}

// Siblings
function getSaudara(idPerson) {
  const o = cariOrang(idPerson);
  const ortuRows = getOrangTua(o.id_person);
  if (!ortuRows.length) return [];
  const ortuIds = ortuRows.map((r) => r.id_orangtua.toUpperCase());
  const saudaraIds = new Set();
  ortuIds.forEach((oid) => {
    getAnak(oid).forEach((r) => {
      if (r.id_anak.toUpperCase() !== o.id_person.toUpperCase()) saudaraIds.add(r.id_anak);
    });
  });
  return Array.from(saudaraIds).map((id) => cariOrang(id));
}

// Tree traversal
function ancestors(idPerson, maxDepth) {
  const hasil = [];
  const visited = new Set();
  function walk(current, depth) {
    if (depth > (maxDepth || 4)) return;
    const ortuRows = getOrangTua(current);
    ortuRows.forEach((r) => {
      const pid = r.id_orangtua;
      if (visited.has(pid.toUpperCase())) return;
      visited.add(pid.toUpperCase());
      const o = cariOrang(pid);
      hasil.push({ level: depth, orang: o, jenis: r.jenis });
      walk(o.id_person, depth + 1);
    });
  }
  walk(str(idPerson), 1);
  return hasil;
}
function descendants(idPerson, maxDepth) {
  const hasil = [];
  const visited = new Set();
  function walk(current, depth) {
    if (depth > (maxDepth || 4)) return;
    const anakRows = getAnak(current);
    anakRows.forEach((r) => {
      const cid = r.id_anak;
      if (visited.has(cid.toUpperCase())) return;
      visited.add(cid.toUpperCase());
      const o = cariOrang(cid);
      hasil.push({ level: depth, orang: o, jenis: r.jenis });
      walk(o.id_person, depth + 1);
    });
  }
  walk(str(idPerson), 1);
  return hasil;
}

// TelegramUser linking adapted
function getTelegramUserRows() {
  return bacaTabel(SHEET_TELEGRAM_USER).rows.map((t) => ({
    id_telegram: str(t.id_telegram),
    username: str(t.username),
    nama: str(t.nama),
    id_person: str(t.id_person),
    peran: str(t.peran).toLowerCase() || "warga",
    status: str(t.status).toLowerCase() || TELEGRAM_MENUNGGU,
    diminta_pada: t.diminta_pada,
    diverifikasi_oleh: str(t.diverifikasi_oleh),
    diverifikasi_pada: t.diverifikasi_pada,
    _row: t._row,
  })).filter((t) => t.id_telegram && t.id_person);
}
function cariTelegramUser(idTelegram, idPerson) {
  const id = str(idTelegram);
  const pid = str(idPerson);
  return (getTelegramUserRows().filter((t) => t.id_telegram === id && t.id_person === pid)[0] || null);
}
function getPersonTerhubung(idTelegram) {
  const id = str(idTelegram);
  if (!id) return [];
  const orang = getOrang();
  return getTelegramUserRows()
    .filter((t) => t.id_telegram === id && t.status === TELEGRAM_AKTIF)
    .map((t) => {
      const o = orang.filter((x) => x.id_person === t.id_person)[0];
      return o ? { id_person: o.id_person, nama: o.nama, status_person: o.status } : null;
    })
    .filter(Boolean);
}
function isPersonTerhubung(idTelegram, idPerson) {
  return getPersonTerhubung(idTelegram).some((o) => o.id_person === str(idPerson));
}
function batasTelegramPerPerson() { return Math.max(0, parseAngka(getSetting("maks_telegram_per_person"))); }
function batasPersonPerTelegram() { return Math.max(0, parseAngka(getSetting("maks_person_per_telegram"))); }
function hitungAkunPerson(idPerson) {
  const pid = str(idPerson);
  return getTelegramUserRows().filter((t) => t.id_person === pid && (t.status === TELEGRAM_MENUNGGU || t.status === TELEGRAM_AKTIF)).length;
}
function hitungPersonAktifTelegram(idTelegram) {
  const id = str(idTelegram);
  const seen = {};
  getTelegramUserRows().forEach((t) => {
    if (t.id_telegram === id && t.status === TELEGRAM_AKTIF) seen[t.id_person] = true;
  });
  return Object.keys(seen).length;
}
function ajukanKeterkaitan(idTelegram, username, nama, identifier) {
  const id = str(idTelegram);
  if (!id) throw new Error("ID Telegram tidak valid.");
  const orang = cariOrang(identifier);
  if (str(orang.status).toLowerCase() !== "aktif") throw new Error("Orang " + orang.id_person + " berstatus " + orang.status + " dan tidak bisa dihubungkan.");
  const semua = getTelegramUserRows();
  const ada = semua.filter((t) => t.id_telegram === id && t.id_person === orang.id_person)[0];
  if (ada && ada.status === TELEGRAM_AKTIF) return { id_telegram: id, id_person: orang.id_person, status: TELEGRAM_AKTIF, sudah: true, orang: orang };
  if (ada && ada.status === TELEGRAM_MENUNGGU) return { id_telegram: id, id_person: orang.id_person, status: TELEGRAM_MENUNGGU, sudah: true, orang: orang };
  const batasPerson = batasPersonPerTelegram();
  if (batasPerson > 0 && hitungPersonAktifTelegram(id) >= batasPerson) throw new Error("Akun ini sudah terhubung ke " + batasPerson + " orang. Maksimal " + batasPerson + " orang per akun.");
  const batasAkun = batasTelegramPerPerson();
  if (batasAkun > 0) {
    const sudah = semua.filter((t) => t.id_person === orang.id_person && t.id_telegram !== id && (t.status === TELEGRAM_MENUNGGU || t.status === TELEGRAM_AKTIF)).length;
    if (sudah >= batasAkun) throw new Error("Orang " + orang.id_person + " sudah punya " + sudah + " akun terhubung/pending. Maksimal " + batasAkun + " akun per orang.");
  }
  if (ada) {
    setSel(SHEET_TELEGRAM_USER, ada._row, "username", str(username));
    setSel(SHEET_TELEGRAM_USER, ada._row, "nama", str(nama));
    setSel(SHEET_TELEGRAM_USER, ada._row, "status", TELEGRAM_MENUNGGU);
    setSel(SHEET_TELEGRAM_USER, ada._row, "diminta_pada", new Date());
    setSel(SHEET_TELEGRAM_USER, ada._row, "diverifikasi_oleh", "");
    setSel(SHEET_TELEGRAM_USER, ada._row, "diverifikasi_pada", "");
  } else {
    tambahBaris(SHEET_TELEGRAM_USER, {
      id_telegram: id,
      username: str(username),
      nama: str(nama),
      id_person: orang.id_person,
      peran: "warga",
      status: TELEGRAM_MENUNGGU,
      diminta_pada: new Date(),
      diverifikasi_oleh: "",
      diverifikasi_pada: "",
    });
  }
  return { id_telegram: id, id_person: orang.id_person, status: TELEGRAM_MENUNGGU, sudah: false, orang: orang };
}
function barisUntukArg(arg) {
  const a = str(arg);
  if (!a) throw new Error("Sebutkan id_person atau id_telegram.");
  const semua = getTelegramUserRows();
  if (/^\d+$/.test(a)) {
    const byId = semua.filter((t) => t.id_telegram === a);
    if (byId.length) return byId;
  }
  const o = cariOrang(a);
  return semua.filter((t) => t.id_person === o.id_person);
}
function verifikasiKeterkaitan(arg, oleh) {
  const rows = barisUntukArg(arg);
  const menunggu = rows.filter((t) => t.status === TELEGRAM_MENUNGGU);
  if (!menunggu.length) {
    const aktif = rows.filter((t) => t.status === TELEGRAM_AKTIF);
    if (aktif.length) throw new Error("Akun untuk '" + str(arg) + "' sudah aktif.");
    throw new Error("Tidak ada pengajuan menunggu untuk '" + str(arg) + "'.");
  }
  if (menunggu.length > 1) throw new Error("Ada lebih dari satu pengajuan. Gunakan id_telegram: " + menunggu.map((t) => t.id_telegram).join(", "));
  const t = menunggu[0];
  const batasAkun = batasTelegramPerPerson();
  if (batasAkun > 0) {
    const aktifLain = getTelegramUserRows().filter((x) => x.id_person === t.id_person && x.status === TELEGRAM_AKTIF && x.id_telegram !== t.id_telegram).length;
    if (aktifLain >= batasAkun) throw new Error("Orang " + t.id_person + " sudah punya " + batasAkun + " akun aktif. Cabut salah satu dulu.");
  }
  const batasPerson = batasPersonPerTelegram();
  if (batasPerson > 0) {
    const sudah = getPersonTerhubung(t.id_telegram).some((o) => o.id_person === t.id_person);
    if (!sudah && hitungPersonAktifTelegram(t.id_telegram) >= batasPerson) throw new Error("Akun ini sudah terhubung ke " + batasPerson + " orang. Maksimal " + batasPerson + " orang per akun.");
  }
  const sekarang = new Date();
  setSel(SHEET_TELEGRAM_USER, t._row, "status", TELEGRAM_AKTIF);
  setSel(SHEET_TELEGRAM_USER, t._row, "diverifikasi_oleh", str(oleh));
  setSel(SHEET_TELEGRAM_USER, t._row, "diverifikasi_pada", sekarang);
  return Object.assign({}, t, { status: TELEGRAM_AKTIF, diverifikasi_oleh: str(oleh), diverifikasi_pada: sekarang, orang: cariOrang(t.id_person) });
}
function tolakKeterkaitan(arg, oleh) {
  const rows = barisUntukArg(arg);
  const menunggu = rows.filter((t) => t.status === TELEGRAM_MENUNGGU);
  if (!menunggu.length) {
    const aktif = rows.filter((t) => t.status === TELEGRAM_AKTIF);
    if (aktif.length) throw new Error("Akun sudah aktif. Gunakan /cabut untuk memutuskan.");
    throw new Error("Tidak ada pengajuan menunggu untuk '" + str(arg) + "'.");
  }
  if (menunggu.length > 1) throw new Error("Ada lebih dari satu pengajuan. Gunakan id_telegram: " + menunggu.map((t) => t.id_telegram).join(", "));
  const t = menunggu[0];
  const sekarang = new Date();
  setSel(SHEET_TELEGRAM_USER, t._row, "status", TELEGRAM_DITOLAK);
  setSel(SHEET_TELEGRAM_USER, t._row, "diverifikasi_oleh", str(oleh));
  setSel(SHEET_TELEGRAM_USER, t._row, "diverifikasi_pada", sekarang);
  return Object.assign({}, t, { status: TELEGRAM_DITOLAK, diverifikasi_oleh: str(oleh), diverifikasi_pada: sekarang, orang: cariOrang(t.id_person) });
}
function cabutKeterkaitan(arg, oleh) {
  const rows = barisUntukArg(arg).filter((t) => t.status === TELEGRAM_AKTIF);
  if (!rows.length) throw new Error("Tidak ada keterkaitan aktif untuk '" + str(arg) + "'.");
  const sekarang = new Date();
  rows.forEach((t) => {
    setSel(SHEET_TELEGRAM_USER, t._row, "status", TELEGRAM_DICABUT);
    setSel(SHEET_TELEGRAM_USER, t._row, "diverifikasi_oleh", str(oleh));
    setSel(SHEET_TELEGRAM_USER, t._row, "diverifikasi_pada", sekarang);
  });
  return rows.map((t) => Object.assign({}, t, { status: TELEGRAM_DICABUT, diverifikasi_oleh: str(oleh), diverifikasi_pada: sekarang }));
}
function isPrivateChat(chatId) {
  const n = Number(chatId);
  return isFinite(n) && n > 0;
}
function notifPengajuanAdmin(hasil, username, nama) {
  const daftarAdmin = getAdminIds();
  if (!daftarAdmin.length) return;
  const o = hasil.orang || {};
  const teks = "🔔 *Pengajuan Keterkaitan*\n\n" +
    "👤 " + escMd(nama || "-") + (username ? " (@" + escMd(username) + ")" : "") + "\n" +
    "🆔 id_telegram: `" + hasil.id_telegram + "`\n" +
    "👤 Orang: *" + o.id_person + "* · " + escMd(o.nama) + "\n\n" +
    "Setujui: " + cmdLink("/verifikasi " + o.id_person) + "\n" +
    "Tolak: " + cmdLink("/tolak " + o.id_person);
  daftarAdmin.forEach((adminId) => { aman(() => sendTelegramMessage(adminId, teks)); });
}

// Telegram send
function pecahPesan(text, max) {
  const batas = max || 3500;
  const s = str(text);
  if (s.length <= batas) return [s];
  const hasil = [];
  let buf = "";
  s.split("\n").forEach((line) => {
    if ((buf + "\n" + line).length > batas) { if (buf) hasil.push(buf); buf = line; }
    else buf = buf ? buf + "\n" + line : line;
  });
  if (buf) hasil.push(buf);
  return hasil;
}
function sendTelegramMessage(chatId, text) {
  const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
  const potongan = pecahPesan(text);
  potongan.forEach((teks) => {
    const payload = { chat_id: chatId, text: teks, parse_mode: "Markdown" };
    const options = { method: "post", contentType: "application/json", payload: JSON.stringify(payload) };
    try {
      UrlFetchApp.fetch(url, options);
    } catch (error) {
      const pesan = error && error.toString ? error.toString() : String(error);
      const salahFormat = /(400|bad request|can't parse entities|can't find end of the entity)/i.test(pesan);
      if (!salahFormat) { Logger.log("Error: " + pesan); return; }
      try { UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: chatId, text: teks }) }); }
      catch (err2) { Logger.log("Fallback gagal: " + (err2 && err2.toString ? err2.toString() : String(err2))); }
    }
  });
}
function sendAdminMessage(chatId, text) { return sendTelegramMessage(chatId, "👮 *ADMIN*\n\n" + text); }

// webhook/polling
function getProcessedUpdateIds() { try { const raw = PropertiesService.getScriptProperties().getProperty("PROCESSED_UPDATE_IDS"); return raw ? JSON.parse(raw) : []; } catch (e) { return []; } }
function saveProcessedUpdateIds(ids) { try { PropertiesService.getScriptProperties().setProperty("PROCESSED_UPDATE_IDS", JSON.stringify(ids)); } catch (e) {} }
function isAckOnly() { try { return PropertiesService.getScriptProperties().getProperty("ACK_ONLY") === "true"; } catch (e) { return false; } }
function isProcessed(updateId) { if (updateId == null) return false; return getProcessedUpdateIds().indexOf(String(updateId)) >= 0; }
function markProcessed(updateId) {
  if (updateId == null) return;
  const ids = getProcessedUpdateIds();
  const key = String(updateId);
  if (ids.indexOf(key) < 0) { ids.push(key); if (ids.length > 200) ids.splice(0, ids.length - 200); saveProcessedUpdateIds(ids); }
}
function setWebhook(dropPending) {
  let url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/setWebhook?url=" + WEBHOOK_URL;
  if (dropPending !== false) url += "&drop_pending_updates=true";
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
  return response.getContentText();
}
function deleteWebhook(dropPending) {
  const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/deleteWebhook?drop_pending_updates=" + (dropPending ? "true" : "false");
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
  return response.getContentText();
}
function getBotUsername() {
  try {
    const props = PropertiesService.getScriptProperties();
    const cached = props.getProperty("BOT_USERNAME");
    if (cached) return cached;
    const res = UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/getMe");
    const data = JSON.parse(res.getContentText());
    if (data && data.ok && data.result && data.result.username) { props.setProperty("BOT_USERNAME", data.result.username); return data.result.username; }
  } catch (e) { Logger.log("getBotUsername error: " + e.toString()); }
  return "";
}
function cmdLink(teksPerintah) {
  const u = getBotUsername();
  if (!u) return "`" + teksPerintah + "`";
  const url = "https://t.me/" + u + "?text=" + encodeURIComponent(teksPerintah);
  return "[" + teksPerintah + "](" + url + ")";
}
function pollTelegram() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) { Logger.log("pollTelegram: could not acquire lock"); return; }
  try {
    const props = PropertiesService.getScriptProperties();
    const lastId = Number(props.getProperty("LAST_UPDATE_ID") || 0);
    const offset = lastId > 0 ? lastId + 1 : 0;
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/getUpdates?offset=" + offset + "&timeout=5";
    const res = UrlFetchApp.fetch(url);
    const data = JSON.parse(res.getContentText());
    if (!data || !data.ok) { Logger.log("pollTelegram getUpdates error: " + res.getContentText()); return; }
    const updates = data.result || [];
    let maxId = lastId;
    updates.forEach((u) => {
      if (u.update_id > maxId) maxId = u.update_id;
      if (u.message && u.message.text) {
        const chatId = u.message.chat.id;
        const userId = u.message.from.id;
        const text = str(u.message.text);
        const senderName = (u.message.from && u.message.from.first_name) || "Warga";
        const username = (u.message.from && u.message.from.username) || "";
        handleCommand(chatId, text, senderName, userId, username);
        markProcessed(u.update_id);
      }
    });
    if (maxId > lastId) props.setProperty("LAST_UPDATE_ID", String(maxId));
  } catch (e) { Logger.log("pollTelegram error: " + e.toString()); }
  finally { lock.releaseLock(); }
}
function setupPollingTrigger() {
  ScriptApp.getProjectTriggers().forEach((t) => { if (t.getHandlerFunction && t.getHandlerFunction() === "pollTelegram") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("pollTelegram").timeBased().everyMinutes(1).create();
  try { deleteWebhook(true); } catch (e) {}
}
function stopPollingTrigger() {
  ScriptApp.getProjectTriggers().forEach((t) => { if (t.getHandlerFunction && t.getHandlerFunction() === "pollTelegram") ScriptApp.deleteTrigger(t); });
}

// setupSheets
function seedSettings() {
  if (bacaTabel(SHEET_SETTING).rows.some((r) => str(r.kunci))) return 0;
  Object.keys(DEFAULT_SETTINGS).forEach((k) => {
    const d = DEFAULT_SETTINGS[k];
    tambahBaris(SHEET_SETTING, { kunci: k, nilai: d.nilai, tipe: d.tipe, keterangan: d.keterangan });
  });
  return Object.keys(DEFAULT_SETTINGS).length;
}
function terapkanSchema(sheet, nama) {
  const skema = SHEET_SCHEMA[nama] || [];
  sheet.clear();
  if (skema.length) sheet.appendRow(skema);
  sheet.setFrozenRows(1);
}
function backupSpreadsheet(ss) { return null; }
function setupSheets(opsi) {
  const o = opsi || {};
  const mode = str(o.mode) || "safe";
  if (["safe", "reset", "fresh"].indexOf(mode) < 0) throw new Error("Mode harus safe/reset/fresh.");
  const dryRun = o.dryRun === true;
  let ss = o.spreadsheet;
  if (!ss) {
    const id = str(o.spreadsheetId) || SPREADSHEET_ID;
    if (!id) throw new Error("SPREADSHEET_ID belum diisi.");
    ss = SpreadsheetApp.openById(id);
  }
  const hapus = mode === "safe" ? [] : mode === "reset" ? SHEET_SKEMA.slice() : SHEET_SKEMA.concat(SHEET_DATA);
  const ada = {};
  ss.getSheets().forEach((s) => { ada[s.getName()] = s; });
  const akanHapus = hapus.filter((n) => ada[n]);
  const akanBuat = [];
  if (mode === "safe") Object.keys(SHEET_SCHEMA).forEach((n) => { if (!ada[n]) akanBuat.push(n); });
  else hapus.forEach((n) => { if (!ada[n] || akanHapus.indexOf(n) >= 0) akanBuat.push(n); });
  if (dryRun) return { mode, dryRun: true, akanHapus, akanBuat };
  let temp = null;
  if (akanHapus.length) temp = ss.insertSheet("_init_temp");
  akanHapus.forEach((n) => { aman(() => ss.deleteSheet(ada[n])); });
  akanBuat.forEach((n) => {
    const sheet = ss.getSheetByName(n) || ss.insertSheet(n);
    terapkanSchema(sheet, n);
  });
  SHEET_DATA.forEach((n) => {
    if (ss.getSheetByName(n)) return;
    const sheet = ss.insertSheet(n);
    terapkanSchema(sheet, n);
  });
  if (temp) aman(() => ss.deleteSheet(temp));
  const seed = { setting: seedSettings() };
  return { mode, dihapus: akanHapus, dibuat: akanBuat, seed };
}
function initSheets() { return setupSheets({ mode: "safe" }); }

// Node compat helpers for admin IDs in tests
// (setAdminIds already defined)

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    str, aman, parseAngka, toBool, parseTanggal, formatTanggal, pad2, escMd, naturalCompare, padKanan, padKiri,
    getSpreadsheet, bacaTabel, tambahBaris, setSel, konversiNilai,
    getSettings, getSetting, setSetting,
    getAdminTambahan, getAdminIds, isAdmin, isAdminInti, simpanAdminTambahan, setAdminIds, setGroupChatId, getGroupChatId,
    teksPerintah, balas, balasError, tolakAdmin,
    generateIdPerson, generateIdRelasi, generateIdPasangan,
    getOrang, getOrangAktif, cariOrang, tambahOrang, ubahOrang, normalizeJK,
    getRelasiOrtu, getOrangTua, getAnak, hubungkanAnak, copotOrang,
    getPasanganRows, getPasanganPerson, nikah, cerai,
    getSaudara, ancestors, descendants,
    getTelegramUserRows, cariTelegramUser, getPersonTerhubung, isPersonTerhubung, batasTelegramPerPerson, batasPersonPerTelegram, hitungAkunPerson, hitungPersonAktifTelegram, ajukanKeterkaitan, barisUntukArg, verifikasiKeterkaitan, tolakKeterkaitan, cabutKeterkaitan, isPrivateChat, notifPengajuanAdmin,
    pecahPesan, sendTelegramMessage, sendAdminMessage, getBotUsername, cmdLink, pollTelegram, setupPollingTrigger, stopPollingTrigger, deleteWebhook, setWebhook,
    getProcessedUpdateIds, saveProcessedUpdateIds, isAckOnly, isProcessed, markProcessed,
    seedSettings, terapkanSchema, setupSheets, initSheets,
  };
}