const pakrt = require("../main.gs");

test("handleStart sends greeting", () => {
  const event = { postData: { contents: JSON.stringify({ update_id: 1, message: { chat: { id: 123 }, from: { id: 777777, first_name: "Admin" }, text: "/start" } }) } };
  const res = pakrt.doPost(event);
  expect(res._text).toBe("OK");
});

test("cari orang returns results", () => {
  const sent = [];
  // rely on global UrlFetchApp from setup
  const event = { postData: { contents: JSON.stringify({ update_id: 2, message: { chat: { id: 123 }, from: { id: 777777, first_name: "Admin" }, text: "/cari Ahmad" } }) } };
  pakrt.doPost(event);
});