const { createMockSheet, createMockSpreadsheet, setSpreadsheet } = require("./helpers/mockSheet");
const app = require("../main.gs");

test("initSheets creates all tabs and seeds settings", () => {
  const ss = createMockSpreadsheet({});
  global.SpreadsheetApp = { openById: () => ss };
  global.SPREADSHEET_ID = "mock";
  app.setAdminIds(["777777"]);
  const res = app.initSheets();
  expect(res).toBeTruthy();
  expect(ss.getSheetByName("Setting")).toBeTruthy();
  expect(ss.getSheetByName("Orang")).toBeTruthy();
  expect(ss.getSheetByName("OrangTuaAnak")).toBeTruthy();
  expect(ss.getSheetByName("Pasangan")).toBeTruthy();
  expect(ss.getSheetByName("TelegramUser")).toBeTruthy();
  expect(ss.getSheetByName("Pengumuman")).toBeTruthy();
});

test("setupSheets dryRun returns plan without changes", () => {
  const ss = createMockSpreadsheet({});
  global.SpreadsheetApp = { openById: () => ss };
  global.SPREADSHEET_ID = "mock";
  const res = app.setupSheets({ mode: "safe", dryRun: true, spreadsheet: ss });
  expect(res.dryRun).toBe(true);
  expect(ss.getSheetByName("Setting")).toBeNull();
});