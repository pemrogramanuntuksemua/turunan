function isRegisteredUser(userId) {
  if (isAdmin(userId)) return true;
  try {
    return getTelegramUserRows().some((t) => t.id_telegram === str(userId));
  } catch (e) {
    return false;
  }
}

function handleStart(chatId, text, senderName, userId, username) {
  let namaKeluarga = "Keluarga";
  try { namaKeluarga = getSetting("nama_keluarga", "Keluarga"); } catch (e) {}
  let replyText = "👋 *Selamat datang di Bot Pohon Keluarga*\n\n" +
    "Keluarga: *" + escMd(namaKeluarga) + "*\n\n";
  if (!isRegisteredUser(userId)) {
    replyText +=
      "Akun Anda belum terdaftar. Silakan daftar terlebih dahulu:\n" +
      "`/gabung <id>` - Hubungkan akun (DM)\n" +
      "`/saya` - Cek status keterkaitan akun\n\n" +
      "_Contoh: /gabung P-001_";
    const pesan = replyText.replace(/`/g, "");
    sendTelegramMessage(chatId, pesan);
    return;
  }
  replyText += "Pilih menu:\n" + "`/untukwarga` - Menu untuk warga\n" + "`/untukadmin` - Menu untuk admin\n";
  if (isAdmin(userId)) {
    replyText += "`/system` - Menu system (root admin)\n";
  }
  const pesan = replyText.replace(/`/g, "");
  sendTelegramMessage(chatId, pesan);
}

function handleCari(chatId, text) {
  const q = teksPerintah(text, "/cari");
  if (!q) { balasError(chatId, new Error("Gunakan: /cari <nama atau id>")); return; }
  const semua = getOrang();
  const up = q.toUpperCase();
  let hasil = semua.filter((o) => o.id_person.toUpperCase() === up || o.nama.toUpperCase().indexOf(up) >= 0);
  if (!hasil.length) { sendTelegramMessage(chatId, "🔍 Tidak ditemukan orang dengan kata '" + escMd(q) + "'."); return; }
  hasil = hasil.slice(0, 20);
  sendTelegramMessage(chatId,
    "🔍 *Hasil pencarian '" + escMd(q) + "'* (" + hasil.length + ")\n\n" +
    hasil.map((o) => "• *" + o.id_person + "* " + escMd(o.nama) + (o.jenis_kelamin ? " (" + o.jenis_kelamin + ")" : "") + (o.status !== "aktif" ? " [" + o.status + "]" : "")).join("\n")
  );
}

function formatOrangCard(o, includePrivate, chatId) {
  const ortu = getOrangTua(o.id_person);
  const anak = getAnak(o.id_person);
  const pas = getPasanganPerson(o.id_person);
  let t = "👤 *" + escMd(o.nama) + "* (" + o.id_person + ")\n";
  t += "JK: " + (o.jenis_kelamin || "-") + " · Status: " + o.status + "\n";
  t += "Lahir: " + (o.tanggal_lahir || "-") + " · Wafat: " + (o.tanggal_wafat || "-") + "\n";
  if (includePrivate && (o.no_hp || o.alamat)) {
    t += (o.no_hp ? "HP: " + escMd(o.no_hp) + "\n" : "") + (o.alamat ? "Alamat: " + escMd(o.alamat) + "\n" : "");
  }
  if (o.catatan) t += "Catatan: " + escMd(o.catatan) + "\n";
  if (o.foto_drive_id) t += "📷 Foto: " + cmdLink("/foto " + o.id_person) + "\n";
  t += "\n*Orang tua:*\n" + (ortu.length ? ortu.map((r) => "• " + r.id_orangtua + " " + escMd(cariOrang(r.id_orangtua).nama) + " (" + r.jenis + ")").join("\n") : "• -") + "\n";
  t += "*Pasangan:*\n" + (pas.length ? pas.map((p) => {
    const other = p.id_suami.toUpperCase() === o.id_person.toUpperCase() ? p.id_istri : p.id_suami;
    let namaOther = "-";
    try { namaOther = cariOrang(other).nama; } catch (e) {}
    return "• " + p.id_pasangan + " " + escMd(namaOther) + " (" + p.status + ")";
  }).join("\n") : "• -") + "\n";
  t += "*Anak:*\n" + (anak.length ? anak.map((r) => "• " + r.id_anak + " " + escMd(cariOrang(r.id_anak).nama)).join("\n") : "• -");
  return t;
}

function handleOrang(chatId, text, senderName, userId, username) {
  const arg = teksPerintah(text, "/orang");
  if (!arg) { balasError(chatId, new Error("Gunakan: /orang <id atau nama>")); return; }
  let o;
  try { o = cariOrang(arg); } catch (e) { balasError(chatId, e); return; }
  const privateOk = isAdmin(userId) || isPersonTerhubung(userId, o.id_person);
  const isGroup = !isPrivateChat(chatId);
  let includePrivate = privateOk && !isGroup;
  if (!privateOk && !isGroup) {
    // di grup: kartu ringkas tanpa kontak
    includePrivate = false;
  }
  if (!privateOk && isPrivateChat(chatId)) {
    // akun belum terhubung: arahan gabung
    sendTelegramMessage(chatId, formatOrangCard(o, false, chatId) + "\n\n💡 Hubungkan akun Anda dengan /gabung " + o.id_person + " untuk melihat detail.");
    return;
  }
  if (isGroup && !isAdmin(userId)) {
    sendTelegramMessage(chatId, formatOrangCard(o, false, chatId));
    return;
  }
  sendTelegramMessage(chatId, formatOrangCard(o, includePrivate, chatId));
}

function handleOrangTua(chatId, text) {
  const arg = teksPerintah(text, "/orangtua");
  if (!arg) { balasError(chatId, new Error("Gunakan: /orangtua <id>")); return; }
  let o;
  try { o = cariOrang(arg); } catch (e) { balasError(chatId, e); return; }
  const ortu = getOrangTua(o.id_person);
  if (!ortu.length) { sendTelegramMessage(chatId, "Orang tua " + o.id_person + " belum tercatat."); return; }
  sendTelegramMessage(chatId, "👨‍👩‍👦 *Orang tua " + escMd(o.nama) + "*\n\n" + ortu.map((r) => {
    const p = cariOrang(r.id_orangtua);
    return "• " + p.id_person + " " + escMd(p.nama) + " (" + r.jenis + ")";
  }).join("\n"));
}

function handleAnak(chatId, text) {
  const arg = teksPerintah(text, "/anak");
  if (!arg) { balasError(chatId, new Error("Gunakan: /anak <id>")); return; }
  let o;
  try { o = cariOrang(arg); } catch (e) { balasError(chatId, e); return; }
  const anak = getAnak(o.id_person);
  if (!anak.length) { sendTelegramMessage(chatId, "Belum ada anak tercatat untuk " + o.id_person + "."); return; }
  sendTelegramMessage(chatId, "👶 *Anak " + escMd(o.nama) + "*\n\n" + anak.map((r) => {
    const c = cariOrang(r.id_anak);
    return "• " + c.id_person + " " + escMd(c.nama) + " (" + r.jenis + ")";
  }).join("\n"));
}

function handlePasangan(chatId, text) {
  const arg = teksPerintah(text, "/pasangan");
  if (!arg) { balasError(chatId, new Error("Gunakan: /pasangan <id>")); return; }
  let o;
  try { o = cariOrang(arg); } catch (e) { balasError(chatId, e); return; }
  const pas = getPasanganPerson(o.id_person);
  if (!pas.length) { sendTelegramMessage(chatId, "Belum ada pasangan tercatat untuk " + o.id_person + "."); return; }
  sendTelegramMessage(chatId, "💑 *Pasangan " + escMd(o.nama) + "*\n\n" + pas.map((p) => {
    const other = p.id_suami.toUpperCase() === o.id_person.toUpperCase() ? p.id_istri : p.id_suami;
    let namaOther = "-";
    try { namaOther = cariOrang(other).nama; } catch (e) {}
    return "• " + p.id_pasangan + " " + escMd(namaOther) + " — " + p.status + (p.tanggal_nikah ? " (menikah " + p.tanggal_nikah + ")" : "");
  }).join("\n"));
}

function handleSaudara(chatId, text) {
  const arg = teksPerintah(text, "/saudara");
  if (!arg) { balasError(chatId, new Error("Gunakan: /saudara <id>")); return; }
  let o;
  try { o = cariOrang(arg); } catch (e) { balasError(chatId, e); return; }
  const saudara = getSaudara(o.id_person);
  if (!saudara.length) { sendTelegramMessage(chatId, "Belum ada saudara tercatat untuk " + o.id_person + "."); return; }
  sendTelegramMessage(chatId, "👨‍👩‍👧‍👦 *Saudara " + escMd(o.nama) + "*\n\n" + saudara.map((s) => "• " + s.id_person + " " + escMd(s.nama)).join("\n"));
}

function handleLeluhur(chatId, text) {
  const parts = teksPerintah(text, "/leluhur").split(/\s+/).filter(Boolean);
  if (!parts.length) { balasError(chatId, new Error("Gunakan: /leluhur <id> [level]")); return; }
  let o;
  try { o = cariOrang(parts[0]); } catch (e) { balasError(chatId, e); return; }
  const level = parts[1] ? parseAngka(parts[1]) : (getSetting("tampil_generasi_maks", 4));
  const anc = ancestors(o.id_person, level || 4);
  if (!anc.length) { sendTelegramMessage(chatId, "Leluhur " + o.id_person + " belum tercatat."); return; }
  const byLevel = {};
  anc.forEach((a) => { if (!byLevel[a.level]) byLevel[a.level] = []; byLevel[a.level].push(a); });
  let t = "🌳 *Leluhur " + escMd(o.nama) + "*\n\n";
  Object.keys(byLevel).sort((a,b)=>a-b).forEach((lvl) => {
    t += "Generasi -" + lvl + ":\n" + byLevel[lvl].map((a) => "• " + a.orang.id_person + " " + escMd(a.orang.nama)).join("\n") + "\n";
  });
  sendTelegramMessage(chatId, t);
}

function handleKeturunan(chatId, text) {
  const parts = teksPerintah(text, "/keturunan").split(/\s+/).filter(Boolean);
  if (!parts.length) { balasError(chatId, new Error("Gunakan: /keturunan <id> [level]")); return; }
  let o;
  try { o = cariOrang(parts[0]); } catch (e) { balasError(chatId, e); return; }
  const level = parts[1] ? parseAngka(parts[1]) : (getSetting("tampil_generasi_maks", 4));
  const desc = descendants(o.id_person, level || 4);
  if (!desc.length) { sendTelegramMessage(chatId, "Keturunan " + o.id_person + " belum tercatat."); return; }
  const byLevel = {};
  desc.forEach((a) => { if (!byLevel[a.level]) byLevel[a.level] = []; byLevel[a.level].push(a); });
  let t = "🌱 *Keturunan " + escMd(o.nama) + "*\n\n";
  Object.keys(byLevel).sort((a,b)=>a-b).forEach((lvl) => {
    t += "Generasi +" + lvl + ":\n" + byLevel[lvl].map((a) => "• " + a.orang.id_person + " " + escMd(a.orang.nama)).join("\n") + "\n";
  });
  sendTelegramMessage(chatId, t);
}

function handlePohon(chatId, text) {
  const parts = teksPerintah(text, "/pohon").split(/\s+/).filter(Boolean);
  if (!parts.length) { balasError(chatId, new Error("Gunakan: /pohon <id> [level]")); return; }
  let o;
  try { o = cariOrang(parts[0]); } catch (e) { balasError(chatId, e); return; }
  const level = parts[1] ? parseAngka(parts[1]) : (getSetting("tampil_generasi_maks", 4));
  function render(current, depth, prefix) {
    if (depth > level) return "";
    const o2 = (depth === 0) ? o : cariOrang(current);
    let t = prefix + "• " + o2.id_person + " " + escMd(o2.nama) + "\n";
    if (depth < level) {
      const anak = getAnak(o2.id_person);
      anak.forEach((r, i) => {
        t += render(r.id_anak, depth + 1, prefix + "  ");
      });
    }
    return t;
  }
  sendTelegramMessage(chatId, "🌲 *Pohon " + escMd(o.nama) + "*\n\n```\n" + render(o.id_person, 0, "") + "```");
}

function handleStat(chatId) {
  const orang = getOrang();
  const aktif = orang.filter((o) => o.status === "aktif").length;
  const wafat = orang.filter((o) => o.status === "wafat" || o.tanggal_wafat).length;
  const rel = getRelasiOrtu().length;
  const pas = getPasanganRows().length;
  sendTelegramMessage(chatId,
    "📊 *Statistik*\n\n" +
    "Orang tercatat: " + orang.length + "\n" +
    "Aktif: " + aktif + " · Wafat: " + wafat + "\n" +
    "Relasi orang tua-anak: " + rel + "\n" +
    "Pasangan: " + pas
  );
}

function handleGabung(chatId, text, senderName, userId, username) {
  if (!isPrivateChat(chatId)) {
    sendTelegramMessage(chatId, "⚠️ /gabung hanya bisa lewat DM bot.");
    return;
  }
  const arg = teksPerintah(text, "/gabung");
  if (!arg) { balasError(chatId, new Error("Gunakan: /gabung <id/nama>")); return; }
  try {
    const hasil = ajukanKeterkaitan(userId, username, senderName, arg);
    if (hasil.sudah && hasil.status === TELEGRAM_AKTIF) {
      sendTelegramMessage(chatId, "✅ Akun Anda sudah terhubung ke " + hasil.id_person + ".");
      return;
    }
    if (hasil.sudah && hasil.status === TELEGRAM_MENUNGGU) {
      sendTelegramMessage(chatId, "⏳ Pengajuan untuk " + hasil.id_person + " sudah menunggu verifikasi.");
      return;
    }
    notifPengajuanAdmin(hasil, username, senderName);
    sendTelegramMessage(chatId, "✅ Pengajuan keterkaitan ke " + hasil.id_person + " dikirim. Tunggu verifikasi pengurus.");
  } catch (e) { balasError(chatId, e); }
}

function handleSaya(chatId, text, senderName, userId, username) {
  if (!isPrivateChat(chatId)) {
    sendTelegramMessage(chatId, "⚠️ /saya hanya bisa lewat DM bot.");
    return;
  }
  const list = getPersonTerhubung(userId);
  if (!list.length) {
    sendTelegramMessage(chatId, "Akun Anda belum terhubung ke orang mana pun. Gunakan /gabung <id>.");
    return;
  }
  sendTelegramMessage(chatId, "👤 *Akun ini terhubung ke:*\n\n" + list.map((o) => "• " + o.id_person + " " + escMd(o.nama) + " (" + o.status_person + ")").join("\n"));
}

function handlePengumuman(chatId) {
  const rows = bacaTabel(SHEET_PENGUMUMAN).rows.slice(-5).reverse();
  if (!rows.length) { sendTelegramMessage(chatId, "Belum ada pengumuman."); return; }
  sendTelegramMessage(chatId, "📢 *Pengumuman terbaru*\n\n" + rows.map((r) => "• *" + escMd(str(r.kategori)) + "* — " + escMd(str(r.isi)) + " (" + formatTanggal(r.timestamp) + ")").join("\n"));
}

function handleFoto(chatId, text, senderName, userId, username) {
  const arg = teksPerintah(text, "/foto");
  if (!arg) { balasError(chatId, new Error("Gunakan: /foto <id atau nama>")); return; }
  let o;
  try { o = cariOrang(arg); } catch (e) { balasError(chatId, e); return; }
  if (!isAdmin(userId) && !isPersonTerhubung(userId, o.id_person)) {
    balasError(chatId, new Error("Akses ditolak. Hubungkan akun Anda dengan /gabung " + o.id_person));
    return;
  }
  const fileId = str(o.foto_drive_id);
  if (!fileId) {
    sendTelegramMessage(chatId, "📷 Belum ada foto untuk " + o.id_person + " " + escMd(o.nama) + ".");
    return;
  }
  try {
    kirimFoto(chatId, fileId);
  } catch (e) {
    balasError(chatId, new Error("Gagal mengirim foto: " + (e && e.message ? e.message : e)));
  }
}

function handleUntukWarga(chatId, text, senderName, userId) {
  try {
    let replyText =
      "📋 *MENU WARGA*\n\n" +
      "`/cari <nama/id>` - Cari orang\n" +
      "`/orang <id>` - Kartu orang\n" +
      "`/orangtua <id>` - Orang tua\n" +
      "`/anak <id>` - Daftar anak\n" +
      "`/pasangan <id>` - Pasangan\n" +
      "`/saudara <id>` - Saudara\n" +
      "`/leluhur <id> [level]` - Leluhur\n" +
      "`/keturunan <id> [level]` - Keturunan\n" +
      "`/pohon <id> [level]` - Tampilan pohon\n" +
      "`/stat` - Statistik\n" +
      "`/pengumuman` - Pengumuman terbaru\n" +
      "`/foto <id>` - Foto orang\n" +
      "`/gabung <id>` - Hubungkan akun (DM)\n" +
      "`/saya` - Cek keterkaitan (DM)\n\n" +
      "`/start` - Kembali ke menu awal\n";
    const pesan = replyText.replace(/`/g, "");
    sendTelegramMessage(chatId, pesan);
  } catch (e) {
    balasError(chatId, e);
  }
}

function handleUntukAdmin(chatId, text, senderName, userId) {
  if (!isAdmin(userId)) {
    tolakAdmin(chatId);
    return;
  }
  try {
    const replyText =
      "👮 *MENU ADMIN*\n\n" +
      "*Data orang/relasi:*\n" +
      "`/tambahorang Nama#L/P#lahir#wafat#catatan` - Tambah orang\n" +
      "`/editorang id#field=nilai` - Ubah data orang\n" +
      "`/hubungkananak id_anak#id_ortu1#id_ortu2#jenis` - Set orang tua\n" +
      "`/copotorang id_anak#id_ortu` - Lepas relasi orang tua\n" +
      "`/nikah id1#id2#tanggal` - Catat pernikahan\n" +
      "`/cerai id_pasangan` - Tandai cerai\n" +
      "`/hapusorang id` - Nonaktifkan orang\n" +
      "`/setfoto id_person#driveFileId` - Simpan foto\n" +
      "`/hapusfoto id_person` - Hapus foto\n" +
      "`/exportcsv` - Export data orang\n" +
      "`/daftar [filter]` - Daftar orang\n\n" +
      "*Administrasi akun/pengumuman:*\n" +
      "`/verifikasi <id_person/id_telegram>` - Setujui keterkaitan\n" +
      "`/tolak <id_person/id_telegram>` - Tolak keterkaitan\n" +
      "`/cabut <id_person/id_telegram>` - Putuskan keterkaitan\n" +
      "`/buatpengumuman Kategori#Isi` - Simpan & broadcast\n" +
      "`/admin` - Daftar admin\n" +
      "`/admin tambah#id` / `/admin hapus#id` - Kelola admin\n" +
      "`/setting` - Daftar setting\n" +
      "`/set kunci#nilai` - Ubah setting\n\n" +
      "`/start` - Kembali ke menu awal\n";
    const pesan = replyText.replace(/`/g, "");
    sendTelegramMessage(chatId, pesan);
  } catch (e) {
    balasError(chatId, e);
  }
}

function handleSystem(chatId, text, senderName, userId) {
  if (!isAdminInti(userId)) {
    tolakAdmin(chatId);
    return;
  }
  try {
    const replyText =
      "🛠️ *MENU SYSTEM*\n\n" +
      "`/setting` - Daftar pengaturan\n" +
      "`/set kunci#nilai` - Ubah pengaturan\n" +
      "`/admin` - Daftar admin inti & tambahan\n" +
      "`/admin tambah <id_telegram>` - Tambah admin\n" +
      "`/admin hapus <id_telegram>` - Hapus admin tambahan\n\n" +
      "`/start` - Kembali ke menu awal\n";
    const pesan = replyText.replace(/`/g, "");
    sendTelegramMessage(chatId, pesan);
  } catch (e) {
    balasError(chatId, e);
  }
}

// Node/Jest compatibility
if (typeof module !== "undefined" && module.exports) {
    const core = (typeof require !== "undefined") ? require("./core.gs") : null;
    if (core) Object.keys(core).forEach((k) => { if (typeof global !== "undefined") global[k] = core[k]; });
    module.exports = {
        handleStart, handleCari, handleOrang, handleOrangTua, handleAnak, handlePasangan, handleSaudara, handleLeluhur, handleKeturunan, handlePohon, handleStat, handleGabung, handleSaya, handlePengumuman, handleFoto, handleUntukWarga, handleUntukAdmin, handleSystem,
    };
}