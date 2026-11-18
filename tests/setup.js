global.SpreadsheetApp = {
  openById: () => ({ getSheetByName: () => null }),
};
global.UrlFetchApp = {
  fetch: () => ({ getContentText: () => "" }),
};
global.ContentService = {
  createTextOutput: () => ({ setMimeType: () => ({}) }),
  MimeType: { JSON: "application/json" },
};
global.Logger = { log: () => {} };

const __cacheStore = {};
global.CacheService = {
  getScriptCache: () => ({
    get: (k) => (Object.prototype.hasOwnProperty.call(__cacheStore, k) ? __cacheStore[k] : null),
    put: (k, v, ttl) => { __cacheStore[k] = v; },
    remove: (k) => { delete __cacheStore[k]; },
  }),
  __store: __cacheStore,
};
global.__resetCache = () => { Object.keys(__cacheStore).forEach((k) => delete __cacheStore[k]); };

global.HtmlService = {
  createHtmlOutput: (text) => ({ _text: text }),
};

global.LockService = {
  getScriptLock: () => ({
    tryLock: () => true,
    releaseLock: () => {},
  }),
};

global.ScriptApp = {
  getProjectTriggers: () => [],
  newTrigger: () => ({
    timeBased: () => ({
      everyMinutes: () => ({
        create: () => ({}),
      }),
    }),
  }),
  deleteTrigger: () => {},
};

const __propsStore = {};
global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) =>
      Object.prototype.hasOwnProperty.call(__propsStore, k) ? __propsStore[k] : null,
    setProperty: (k, v) => {
      __propsStore[k] = v;
    },
  }),
  __store: __propsStore,
};
