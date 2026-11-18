function requireAdmin(chatId, userId) {
  if (!isAdmin(userId)) { tolakAdmin(chatId); return false; }
  return true;
}

function handleAdmin(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/admin").trim();
  if (!arg) {
    sendAdminMessage(chatId,
      "*Daftar Admin*\n\nInti: " + ADMIN_IDS.join(", ") + "\nTambahan: " + (getAdminTambahan().join(", ") || "-") +
      "\n\nTambah/hapus (khusus inti): /admin tambah#<id> atau /admin hapus#<id>"
    );
    return;
  }
  if (!isAdminInti(userId)) { sendAdminMessage(chatId, "Hanya admin inti yang bisa mengubah admin tambahan."); return; }
  const parts = arg.split("#").map((x) => str(x));
  const aksi = parts[0].toLowerCase();
  const id = parts[1];
  if (!id) { balasError(chatId, new Error("Gunakan: /admin tambah#<id> atau /admin hapus#<id>")); return; }
  if (aksi === "tambah") {
    const list = getAdminTambahan();
    if (list.indexOf(id) < 0) list.push(id);
    simpanAdminTambahan(list);
    sendAdminMessage(chatId, "Admin tambahan ditambahkan: " + id);
  } else if (aksi === "hapus") {
    const list = getAdminTambahan().filter((x) => x !== id);
    simpanAdminTambahan(list);
    sendAdminMessage(chatId, "Admin tambahan dihapus: " + id);
  } else {
    balasError(chatId, new Error("Aksi tidak dikenal. Gunakan tambah/hapus."));
  }
}

function handleTambahOrang(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/tambahorang");
  if (!arg) { balasError(chatId, new Error("Gunakan: /tambahorang Nama#L/P#[lahir]#[wafat]#catatan")); return; }
  const p = arg.split("#");
  const data = { nama: p[0], jenis_kelamin: p[1], tanggal_lahir: p[2], tanggal_wafat: p[3], catatan: p[4] };
  try {
    const o = tambahOrang(data, userId);
    sendAdminMessage(chatId, "✅ Orang ditambahkan: *" + o.id_person + "* " + escMd(o.nama));
  } catch (e) { balasError(chatId, e); }
}

function handleEditOrang(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/editorang");
  if (!arg) { balasError(chatId, new Error("Gunakan: /editorang id#field=nilai (nama,jk,lahir,wafat,status,hp,alamat,catatan)")); return; }
  const parts = arg.split("#");
  const id = parts[0];
  const perubahan = {};
  for (let i = 1; i < parts.length; i++) {
    const kv = parts[i].split("=");
    if (kv.length < 2) continue;
    const k = str(kv[0]).toLowerCase();
    const v = kv.slice(1).join("=");
    if (k === "nama") perubahan.nama = v;
    else if (k === "jk" || k === "jenis_kelamin") perubahan.jk = v;
    else if (k === "lahir" || k === "tanggal_lahir") perubahan.lahir = v;
    else if (k === "wafat" || k === "tanggal_wafat") perubahan.wafat = v;
    else if (k === "status") perubahan.status = v;
    else if (k === "hp" || k === "no_hp") perubahan.hp = v;
    else if (k === "alamat") perubahan.alamat = v;
    else if (k === "catatan") perubahan.catatan = v;
  }
  try {
    const o = ubahOrang(id, perubahan);
    sendAdminMessage(chatId, "✅ Diubah: *" + o.id_person + "* " + escMd(o.nama));
  } catch (e) { balasError(chatId, e); }
}

function handleHubungkanAnak(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/hubungkananak");
  if (!arg) { balasError(chatId, new Error("Gunakan: /hubungkananak id_anak#id_ortu1#[id_ortu2]#[jenis]")); return; }
  const p = arg.split("#");
  try {
    const ortu = hubungkanAnak(p[0], p[1], p[2] && !/^(kandung|angkat|tiri)$/i.test(p[2]) ? p[2] : null, p[3] || p[2]);
    sendAdminMessage(chatId, "✅ Orang tua dihubungkan: " + ortu.map((o) => o.id_person).join(", ") + " → " + p[0]);
  } catch (e) { balasError(chatId, e); }
}

function handleCopotOrang(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/copotorang");
  if (!arg) { balasError(chatId, new Error("Gunakan: /copotorang id_anak#id_ortu")); return; }
  const p = arg.split("#");
  try {
    const n = copotOrang(p[0], p[1]);
    sendAdminMessage(chatId, "✅ Relasi dihapus (" + n + ").");
  } catch (e) { balasError(chatId, e); }
}

function handleNikah(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/nikah");
  if (!arg) { balasError(chatId, new Error("Gunakan: /nikah id1#id2#[tanggal]")); return; }
  const p = arg.split("#");
  try {
    const n = nikah(p[0], p[1], p[2]);
    sendAdminMessage(chatId, "✅ Pernikahan dicatat: " + n.id_pasangan);
  } catch (e) { balasError(chatId, e); }
}

function handleCerai(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/cerai");
  if (!arg) { balasError(chatId, new Error("Gunakan: /cerai id_pasangan")); return; }
  try {
    const p = cerai(arg);
    sendAdminMessage(chatId, "✅ Cerai dicatat: " + p.id_pasangan);
  } catch (e) { balasError(chatId, e); }
}

function handleHapusOrang(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/hapusorang");
  if (!arg) { balasError(chatId, new Error("Gunakan: /hapusorang <id>")); return; }
  try {
    const o = ubahOrang(arg, { status: "nonaktif" });
    sendAdminMessage(chatId, "✅ Dinonaktifkan: " + o.id_person + " " + escMd(o.nama));
  } catch (e) { balasError(chatId, e); }
}

function handleDaftar(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/daftar");
  const orang = getOrang();
  const filter = str(arg).toLowerCase();
  let list = orang;
  if (filter && filter !== "semua") {
    list = orang.filter((o) => o.nama.toLowerCase().indexOf(filter) >= 0 || o.id_person.toLowerCase().indexOf(filter) >= 0 || o.status.toLowerCase() === filter);
  }
  list = list.slice(0, 40);
  sendAdminMessage(chatId, "📋 *Daftar Orang* (" + list.length + ")\n\n" + list.map((o) => "• " + o.id_person + " " + escMd(o.nama) + (o.status !== "aktif" ? " [" + o.status + "]" : "")).join("\n"));
}

function handleVerifikasi(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/verifikasi");
  if (!arg) { balasError(chatId, new Error("Gunakan: /verifikasi <id_person atau id_telegram>")); return; }
  try {
    const hasil = verifikasiKeterkaitan(arg, userId);
    try { sendTelegramMessage(hasil.id_telegram, "✅ Keterkaitan ke " + hasil.id_person + " telah diverifikasi."); } catch (e) {}
    sendAdminMessage(chatId, "✅ Diverifikasi: " + hasil.id_telegram + " → " + hasil.id_person);
  } catch (e) { balasError(chatId, e); }
}
function handleTolak(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/tolak");
  if (!arg) { balasError(chatId, new Error("Gunakan: /tolak <id_person atau id_telegram>")); return; }
  try {
    const hasil = tolakKeterkaitan(arg, userId);
    try { sendTelegramMessage(hasil.id_telegram, "❌ Pengajuan keterkaitan ke " + hasil.id_person + " ditolak."); } catch (e) {}
    sendAdminMessage(chatId, "❌ Ditolak: " + hasil.id_telegram + " → " + hasil.id_person);
  } catch (e) { balasError(chatId, e); }
}
function handleCabut(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/cabut");
  if (!arg) { balasError(chatId, new Error("Gunakan: /cabut <id_person atau id_telegram>")); return; }
  try {
    const rows = cabutKeterkaitan(arg, userId);
    rows.forEach((t) => { try { sendTelegramMessage(t.id_telegram, "🔌 Keterkaitan ke " + t.id_person + " dicabut."); } catch (e) {} });
    sendAdminMessage(chatId, "🔌 Dicabut: " + rows.length + " keterkaitan.");
  } catch (e) { balasError(chatId, e); }
}

function handleBuatPengumuman(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/buatpengumuman");
  if (!arg) { balasError(chatId, new Error("Gunakan: /buatpengumuman Kategori#Isi")); return; }
  const p = arg.split("#");
  const kategori = str(p[0]) || "Info";
  const isi = p.slice(1).join("#").trim();
  if (!isi) { balasError(chatId, new Error("Isi pengumuman kosong.")); return; }
  tambahBaris(SHEET_PENGUMUMAN, { timestamp: new Date(), kategori: kategori, isi: isi, pengirim: senderName });
  // broadcast ke group jika ada
  const gid = getGroupChatId();
  if (gid) aman(() => sendTelegramMessage(gid, "📢 *" + escMd(kategori) + "*\n\n" + escMd(isi)));
  sendAdminMessage(chatId, "✅ Pengumuman disimpan.");
}

function handleSetting(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const settings = getSettings();
  const lines = Object.keys(settings).map((k) => "• " + k + " = " + settings[k]);
  sendAdminMessage(chatId, "*Setting*\n\n" + lines.join("\n"));
}
function handleSet(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/set");
  if (!arg) { balasError(chatId, new Error("Gunakan: /set kunci#nilai")); return; }
  const p = arg.split("#");
  const kunci = str(p[0]);
  const nilai = p.slice(1).join("#");
  if (!kunci) { balasError(chatId, new Error("Kunci kosong.")); return; }
  if (kunci.toLowerCase() === "admin_tambahan") { balasError(chatId, new Error("Gunakan /admin untuk mengubah admin tambahan.")); return; }
  setSetting(kunci, nilai);
  sendAdminMessage(chatId, "✅ " + kunci + " diubah menjadi " + nilai);
}

function handleSetFoto(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/setfoto");
  if (!arg) { balasError(chatId, new Error("Gunakan: /setfoto id_person#driveFileId")); return; }
  const p = arg.split("#");
  try {
    const o = setFoto(p[0], p[1]);
    sendAdminMessage(chatId, "✅ Foto diset untuk " + o.id_person + " " + escMd(o.nama));
  } catch (e) { balasError(chatId, e); }
}
function handleHapusFoto(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const arg = teksPerintah(text, "/hapusfoto");
  if (!arg) { balasError(chatId, new Error("Gunakan: /hapusfoto <id_person>")); return; }
  try {
    const o = hapusFoto(arg);
    sendAdminMessage(chatId, "✅ Foto dihapus untuk " + o.id_person + " " + escMd(o.nama));
  } catch (e) { balasError(chatId, e); }
}

function handleExportCsv(chatId, text, senderName, userId, username) {
  if (!requireAdmin(chatId, userId)) return;
  const orang = getOrang();
  const header = ["id_person", "nama", "jenis_kelamin", "tanggal_lahir", "tanggal_wafat", "status", "no_hp", "alamat", "catatan", "foto_drive_id"];
  const lines = [header.join(",")];
  orang.forEach((o) => {
    const vals = header.map((h) => {
      const v = str(o[h]);
      if (v.indexOf(",") >= 0 || v.indexOf("\"") >= 0 || v.indexOf("\n") >= 0) {
        return "\"" + v.replace(/"/g, "\"\"") + "\"";
      }
      return v;
    });
    lines.push(vals.join(","));
  });
  const csv = lines.join("\n");
  try {
    const blob = Utilities.newBlob(csv, "text/csv", "orang.csv");
    const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendDocument";
    UrlFetchApp.fetch(url, { method: "post", payload: { chat_id: chatId, document: blob, caption: "Export data orang (" + orang.length + " baris)" } });
    sendAdminMessage(chatId, "✅ Export CSV dikirim (" + orang.length + " baris).");
  } catch (e) {
    balasError(chatId, new Error("Gagal export CSV: " + (e && e.message ? e.message : e)));
  }
}

// Node/Jest compatibility
if (typeof module !== "undefined" && module.exports) {
    const core = (typeof require !== "undefined") ? require("./core.gs") : null;
    if (core) Object.keys(core).forEach((k) => { if (typeof global !== "undefined") global[k] = core[k]; });
    module.exports = {
        handleAdmin, handleTambahOrang, handleEditOrang, handleHubungkanAnak, handleCopotOrang, handleNikah, handleCerai, handleHapusOrang, handleDaftar, handleVerifikasi, handleTolak, handleCabut, handleBuatPengumuman, handleSetting, handleSet, handleSetFoto, handleHapusFoto, handleExportCsv,
    };
}