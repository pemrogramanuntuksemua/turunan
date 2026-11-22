const SPREADSHEET_ID = "";
const TELEGRAM_TOKEN = "";
const WEBHOOK_URL = ""; // Diisi setelah deploy

const ADMIN_IDS = [];

let GROUP_CHAT_ID = "";

const SHEET_SETTING = "Setting";
const SHEET_ORANG = "Orang";
const SHEET_ORANGTUA_ANAK = "OrangTuaAnak";
const SHEET_PASANGAN = "Pasangan";
const SHEET_TELEGRAM_USER = "TelegramUser";
const SHEET_PENGUMUMAN = "Pengumuman";

const SHEET_SCHEMA = {
  Setting: ["kunci", "nilai", "tipe", "keterangan"],
  Orang: ["id_person", "nama", "jenis_kelamin", "tanggal_lahir", "tanggal_wafat", "status", "no_hp", "alamat", "catatan", "foto_drive_id", "dibuat_pada", "dibuat_oleh"],
  OrangTuaAnak: ["id_relasi", "id_orangtua", "id_anak", "jenis", "catatan"],
  Pasangan: ["id_pasangan", "id_suami", "id_istri", "tanggal_nikah", "tanggal_cerai", "status", "catatan"],
  TelegramUser: ["id_telegram", "username", "nama", "id_person", "peran", "status", "diminta_pada", "diverifikasi_oleh", "diverifikasi_pada"],
  Pengumuman: ["timestamp", "kategori", "isi", "pengirim"],
};

const SHEET_SKEMA = [
  SHEET_SETTING, SHEET_ORANG, SHEET_ORANGTUA_ANAK, SHEET_PASANGAN, SHEET_TELEGRAM_USER,
];
const SHEET_DATA = [SHEET_PENGUMUMAN];

const CMD_START = "/start";
const CMD_CARI = "/cari";
const CMD_ORANG = "/orang";
const CMD_ORANGTUA = "/orangtua";
const CMD_ANAK = "/anak";
const CMD_PASANGAN = "/pasangan";
const CMD_SAUDARA = "/saudara";
const CMD_LELUHUR = "/leluhur";
const CMD_KETURUNAN = "/keturunan";
const CMD_POHON = "/pohon";
const CMD_STAT = "/stat";
const CMD_GABUNG = "/gabung";
const CMD_SAYA = "/saya";
const CMD_UNTUKWARGA = "/untukwarga";
const CMD_UNTUKADMIN = "/untukadmin";
const CMD_SYSTEM = "/system";
const CMD_PENGUMUMAN = "/pengumuman";
const CMD_FOTO = "/foto";
const CMD_EXPORTCSV = "/exportcsv";

const CMD_TAMBAHORANG = "/tambahorang";
const CMD_SETFOTO = "/setfoto";
const CMD_HAPUSFOTO = "/hapusfoto";
const CMD_EDITORANG = "/editorang";
const CMD_HUBUNGKANANAK = "/hubungkananak";
const CMD_COPOTORANG = "/copotorang";
const CMD_NIKAH = "/nikah";
const CMD_CERAI = "/cerai";
const CMD_HAPUSORANG = "/hapusorang";
const CMD_DAFTAR = "/daftar";
const CMD_VERIFIKASI = "/verifikasi";
const CMD_TOLAK = "/tolak";
const CMD_CABUT = "/cabut";
const CMD_BUATPENGUMUMAN = "/buatpengumuman";
const CMD_ADMIN = "/admin";
const CMD_SETTING = "/setting";
const CMD_SET = "/set";

const STATUS_ORANG_AKTIF = "aktif";
const STATUS_ORANG_NONAKTIF = "nonaktif";

const TELEGRAM_MENUNGGU = "menunggu";
const TELEGRAM_AKTIF = "aktif";
const TELEGRAM_DITOLAK = "ditolak";
const TELEGRAM_DICABUT = "dicabut";

const DEFAULT_SETTINGS = {
  nama_keluarga: { nilai: "Keluarga Besar", tipe: "teks", keterangan: "Nama keluarga/komunitas" },
  maks_telegram_per_person: { nilai: 2, tipe: "angka", keterangan: "Maks akun Telegram per orang (0 = tanpa batas)" },
  maks_person_per_telegram: { nilai: 5, tipe: "angka", keterangan: "Maks orang aktif per akun Telegram (0 = tanpa batas)" },
  tampil_generasi_maks: { nilai: 4, tipe: "angka", keterangan: "Kedalaman tampilan pohon" },
  admin_tambahan: { nilai: "", tipe: "teks", keterangan: "ID Telegram admin tambahan, pisahkan dengan koma" },
};

const _G = (typeof global !== "undefined") ? global : (typeof globalThis !== "undefined" ? globalThis : this);
let PREFIX_HANDLERS = null;
function getPrefixHandlers() {
  if (!PREFIX_HANDLERS) {
    PREFIX_HANDLERS = {
      [CMD_START]: _G.handleStart,
      [CMD_CARI]: _G.handleCari,
      [CMD_ORANG]: _G.handleOrang,
      [CMD_ORANGTUA]: _G.handleOrangTua,
      [CMD_ANAK]: _G.handleAnak,
      [CMD_PASANGAN]: _G.handlePasangan,
      [CMD_SAUDARA]: _G.handleSaudara,
      [CMD_LELUHUR]: _G.handleLeluhur,
      [CMD_KETURUNAN]: _G.handleKeturunan,
      [CMD_POHON]: _G.handlePohon,
      [CMD_STAT]: _G.handleStat,
      [CMD_GABUNG]: _G.handleGabung,
      [CMD_SAYA]: _G.handleSaya,
      [CMD_UNTUKWARGA]: _G.handleUntukWarga,
      [CMD_UNTUKADMIN]: _G.handleUntukAdmin,
      [CMD_SYSTEM]: _G.handleSystem,
      [CMD_PENGUMUMAN]: _G.handlePengumuman,
      [CMD_FOTO]: _G.handleFoto,
      [CMD_EXPORTCSV]: _G.handleExportCsv,
      [CMD_TAMBAHORANG]: _G.handleTambahOrang,
      [CMD_SETFOTO]: _G.handleSetFoto,
      [CMD_HAPUSFOTO]: _G.handleHapusFoto,
      [CMD_EDITORANG]: _G.handleEditOrang,
      [CMD_HUBUNGKANANAK]: _G.handleHubungkanAnak,
      [CMD_COPOTORANG]: _G.handleCopotOrang,
      [CMD_NIKAH]: _G.handleNikah,
      [CMD_CERAI]: _G.handleCerai,
      [CMD_HAPUSORANG]: _G.handleHapusOrang,
      [CMD_DAFTAR]: _G.handleDaftar,
      [CMD_VERIFIKASI]: _G.handleVerifikasi,
      [CMD_TOLAK]: _G.handleTolak,
      [CMD_CABUT]: _G.handleCabut,
      [CMD_BUATPENGUMUMAN]: _G.handleBuatPengumuman,
      [CMD_ADMIN]: _G.handleAdmin,
      [CMD_SETTING]: _G.handleSetting,
      [CMD_SET]: _G.handleSet,
    };
  }
  return PREFIX_HANDLERS;
}

function doGet(e) {
  return HtmlService.createHtmlOutput("OK");
}

function doPost(e) {
  const startTime = new Date().getTime();
  try {
    if (isAckOnly()) return HtmlService.createHtmlOutput("OK");
    const data = JSON.parse(e.postData.contents);
    const updateId = data && data.update_id;
    if (isProcessed(updateId)) return HtmlService.createHtmlOutput("OK");
    markProcessed(updateId);
    if (data.message && data.message.text) {
      const chatId = data.message.chat.id;
      const userId = data.message.from.id;
      const text = str(data.message.text);
      const senderName = data.message.from.first_name || "Warga";
      const username = data.message.from.username || "";
      handleCommand(chatId, text, senderName, userId, username);
    }
    return HtmlService.createHtmlOutput("OK");
  } catch (error) {
    Logger.log("doPost error: " + error.toString());
    return HtmlService.createHtmlOutput("Error: " + error.toString());
  }
}

function handleCommand(chatId, text, senderName, userId, username) {
  if (!chatId) return;
  processItem(chatId, text, senderName, userId, username);
}

function processItem(chatId, text, senderName, userId, username) {
  _G.CURRENT_USER_ID = userId;
  const cleanText = str(text);
  const token = cleanText.split(/\s+/)[0].toLowerCase();
  const handler = getPrefixHandlers()[token];
  if (handler) handler(chatId, cleanText, senderName, userId, username);
}

if (typeof module !== "undefined" && module.exports) {
  const core = (typeof require !== "undefined") ? require("./core.gs") : null;
  const user = (typeof require !== "undefined") ? require("./userHandlers.gs") : null;
  const admin = (typeof require !== "undefined") ? require("./adminHandlers.gs") : null;
  if (core) Object.keys(core).forEach((k) => { if (typeof global !== "undefined") global[k] = core[k]; });
  if (user) Object.keys(user).forEach((k) => { if (typeof global !== "undefined") global[k] = user[k]; });
  if (admin) Object.keys(admin).forEach((k) => { if (typeof global !== "undefined") global[k] = admin[k]; });
  if (typeof global !== "undefined") {
    global.SPREADSHEET_ID = SPREADSHEET_ID;
    global.TELEGRAM_TOKEN = TELEGRAM_TOKEN;
    global.WEBHOOK_URL = WEBHOOK_URL;
    global.ADMIN_IDS = ADMIN_IDS;
    global.GROUP_CHAT_ID = GROUP_CHAT_ID;
    global.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    global.SHEET_SETTING = SHEET_SETTING;
    global.SHEET_ORANG = SHEET_ORANG;
    global.SHEET_ORANGTUA_ANAK = SHEET_ORANGTUA_ANAK;
    global.SHEET_PASANGAN = SHEET_PASANGAN;
    global.SHEET_TELEGRAM_USER = SHEET_TELEGRAM_USER;
    global.SHEET_PENGUMUMAN = SHEET_PENGUMUMAN;
    global.SHEET_SCHEMA = SHEET_SCHEMA;
    global.SHEET_SKEMA = SHEET_SKEMA;
    global.SHEET_DATA = SHEET_DATA;
    global.TELEGRAM_MENUNGGU = TELEGRAM_MENUNGGU;
    global.TELEGRAM_AKTIF = TELEGRAM_AKTIF;
    global.TELEGRAM_DITOLAK = TELEGRAM_DITOLAK;
    global.TELEGRAM_DICABUT = TELEGRAM_DICABUT;
    global.CMD_START = CMD_START;
    global.CMD_UNTUKWARGA = CMD_UNTUKWARGA;
    global.CMD_UNTUKADMIN = CMD_UNTUKADMIN;
    global.CMD_SYSTEM = CMD_SYSTEM;
    global.PREFIX_HANDLERS = getPrefixHandlers();
    global.handleCommand = handleCommand;
    global.processItem = processItem;
    global.doPost = doPost;
    global.doGet = doGet;
  }
  const _exports = Object.assign({}, core || {}, user || {}, admin || {});
  Object.assign(_exports, {
    SPREADSHEET_ID, TELEGRAM_TOKEN, WEBHOOK_URL, GROUP_CHAT_ID,
    ADMIN_IDS, DEFAULT_SETTINGS,
    SHEET_SETTING, SHEET_ORANG, SHEET_ORANGTUA_ANAK, SHEET_PASANGAN, SHEET_TELEGRAM_USER, SHEET_PENGUMUMAN, SHEET_SCHEMA, SHEET_SKEMA, SHEET_DATA,
    TELEGRAM_MENUNGGU, TELEGRAM_AKTIF, TELEGRAM_DITOLAK, TELEGRAM_DICABUT,
    PREFIX_HANDLERS: getPrefixHandlers(),
    handleCommand, processItem, doPost, doGet,
    setAdminIds, setGroupChatId,
  });
  module.exports = _exports;
}