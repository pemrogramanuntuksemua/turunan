function ensureCell(data, rowIdx, colIdx) {
  while (data.length <= rowIdx) data.push([]);
  const row = data[rowIdx];
  while (row.length <= colIdx) row.push("");
}

function createMockSheet(rows, options = {}) {
  const data = rows ? rows.map((r) => r.slice()) : [];
  const appended = [];
  const sheet = {
    _name: options.name || "",
    getName: () => sheet._name,
    setName: (name) => {
      sheet._name = name;
      return sheet;
    },
    getDataRange: () => ({
      getValues: () => data.map((r) => r.slice()),
    }),
    getLastRow: () => (options.lastRow != null ? options.lastRow : data.length),
    getLastColumn: () => data.reduce((max, r) => Math.max(max, r.length), 0),
    appendRow: (row) => {
      const copy = row.slice();
      appended.push(copy);
      data.push(copy);
    },
    clear: () => {
      data.length = 0;
    },
    getRange: (row, col, numRows, numCols) => {
      const nRows = numRows || 1;
      const nCols = numCols || 1;
      return {
        getValues: () => {
          const out = [];
          for (let r = 0; r < nRows; r++) {
            const line = [];
            for (let c = 0; c < nCols; c++) {
              const src = data[row - 1 + r] || [];
              line.push(src[col - 1 + c]);
            }
            out.push(line);
          }
          return out;
        },
        setValue: (value) => {
          ensureCell(data, row - 1, col - 1);
          data[row - 1][col - 1] = value;
        },
        setValues: (values) => {
          (values || []).forEach((line, r) => {
            (line || []).forEach((value, c) => {
              ensureCell(data, row - 1 + r, col - 1 + c);
              data[row - 1 + r][col - 1 + c] = value;
            });
          });
        },
        setFontWeight: () => sheet.getRange(row, col, nRows, nCols),
        setBackground: () => sheet.getRange(row, col, nRows, nCols),
        setNumberFormat: () => sheet.getRange(row, col, nRows, nCols),
        setDataValidation: () => sheet.getRange(row, col, nRows, nCols),
        setHorizontalAlignment: () => sheet.getRange(row, col, nRows, nCols),
      };
    },
    setFrozenRows: () => {},
    setColumnWidth: () => {},
    autoResizeColumns: () => {},
    protect: () => ({
      setDescription: () => ({}),
      setWarningOnly: () => ({}),
    }),
    _appended: appended,
    _data: data,
  };
  return sheet;
}

function createMockSpreadsheet(sheets = {}) {
  const map = {};
  Object.keys(sheets).forEach((name) => {
    const sheet = sheets[name];
    if (sheet && typeof sheet.setName === "function" && !sheet.getName()) {
      sheet.setName(name);
    }
    map[name] = sheet;
  });
  const spreadsheet = {
    getId: () => spreadsheet._id || "mock-spreadsheet-id",
    getSheetByName: (name) => (Object.prototype.hasOwnProperty.call(map, name) ? map[name] : null),
    getSheets: () => Object.keys(map).map((name) => map[name]),
    insertSheet: (name) => {
      const sheet = createMockSheet([], { name });
      map[name] = sheet;
      return sheet;
    },
    deleteSheet: (sheet) => {
      const name = typeof sheet === "string" ? sheet : sheet.getName();
      delete map[name];
    },
    setSpreadsheetTimeZone: () => {},
    setLocale: () => {},
    _sheets: map,
  };
  return spreadsheet;
}

function setSpreadsheet(sheets) {
  const spreadsheet = createMockSpreadsheet(sheets);
  global.SpreadsheetApp = {
    openById: () => spreadsheet,
    insertSheet: (name) => spreadsheet.insertSheet(name),
    newDataValidation: () => {
      const api = {
        requireValueInList: () => api,
        setAllowInvalid: () => api,
        build: () => ({}),
      };
      return api;
    },
    Protection: { WarningOnly: "WARNING_ONLY" },
  };
  return spreadsheet;
}

module.exports = { createMockSheet, createMockSpreadsheet, setSpreadsheet };
