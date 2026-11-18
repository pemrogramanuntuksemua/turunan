const fs = require("fs");
const path = require("path");

// Mock GAS globals
const propsStore = {};
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => (Object.prototype.hasOwnProperty.call(propsStore, k) ? propsStore[k] : null),
    setProperty: (k, v) => { propsStore[k] = v; },
  }),
};
global.LockService = {
  getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
};
global.ScriptApp = {
  getProjectTriggers: () => [],
  newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create: () => ({}) }) }) }),
  deleteTrigger: () => {},
};
global.Logger = { log: (x) => console.log("[LOG]", x) };

const __cacheStore = {};
global.CacheService = {
  getScriptCache: () => ({
    get: (k) => (Object.prototype.hasOwnProperty.call(__cacheStore, k) ? __cacheStore[k] : null),
    put: (k, v, ttl) => { __cacheStore[k] = v; },
    remove: (k) => { delete __cacheStore[k]; },
  }),
};

// Load sample data
const dataPath = path.join(__dirname, "simulate-data.json");
const sampleData = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, "utf8")) : {};

const sheets = {};
Object.keys(sampleData).forEach((name) => {
  if (!Array.isArray(sampleData[name])) return;
  const rows = sampleData[name].map((r) => r.slice());
  const appended = [];
  sheets[name] = {
    getDataRange: () => ({ getValues: () => rows }),
    getLastRow: () => rows.length,
    appendRow: (row) => { appended.push(row); rows.push(row); },
    getRange: () => ({ setValue: () => {} }),
    _appended: appended,
  };
});

global.SpreadsheetApp = {
  openById: () => ({ getSheetByName: (name) => (Object.prototype.hasOwnProperty.call(sheets, name) ? sheets[name] : null) }),
};

// Capture Telegram sendMessage payloads
const sent = [];
const botUsername = process.env.BOT_USERNAME || (sampleData.BOT_USERNAME || "pakrt_bot");
global.UrlFetchApp = {
  fetch: (url, options) => {
    if (String(url).includes("/getMe")) {
      return { getContentText: () => JSON.stringify({ ok: true, result: { username: botUsername } }) };
    }
    if (options && options.payload) {
      try { sent.push(JSON.parse(options.payload)); } catch (e) { sent.push(options.payload); }
    } else {
      console.log("[FETCH]", url);
    }
    return { getContentText: () => JSON.stringify({ ok: true, result: [] }) };
  },
};
global.ContentService = {
  createTextOutput: (text) => ({ _text: text, setMimeType: () => ({ _text: text }) }),
  MimeType: { JSON: "application/json", HTML: "text/html" },
};
global.HtmlService = { createHtmlOutput: (text) => ({ _text: text }) };

// Load app
const pakrt = require("./main.gs");

// Apply admin config from simulate data / env
const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(",") : (sampleData.ADMIN_IDS || []);
pakrt.setAdminIds(adminIds);
if (sampleData.GROUP_CHAT_ID) pakrt.setGroupChatId(sampleData.GROUP_CHAT_ID);

// Parse CLI args
const text = process.argv[2] || "/start";
const chatId = Number(process.argv[3] || 12345);
const userId = Number(process.argv[4] || 777777);
const name = process.argv[5] || "Bre";

const event = {
  postData: {
    contents: JSON.stringify({
      update_id: Date.now(),
      message: { chat: { id: chatId }, from: { id: userId, first_name: name }, text },
    }),
  },
};

console.log("=== SIMULATE ===");
console.log("Input:", text);
pakrt.doPost(event);

console.log("\n=== PESAN TERKIRIM ===");
sent.forEach((p, i) => {
  console.log(`--- ${i + 1} ---`);
  console.log("chat_id:", p.chat_id);
  console.log(p.text);
});
