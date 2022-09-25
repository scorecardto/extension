import Dexie from "dexie";
import { AllContentResponse } from "scorecard-types";
import { addRecordToDb, fetchAllContent } from "./fetcher";

const db = new Dexie("scorecard");

db.version(1).stores({
  records: "++id, date, data, gradingPeriods",
});

chrome.runtime.onConnectExternal.addListener((port) => {
  port.postMessage({ type: "handshake", version: 0.1 });

  // port.onMessage.addListener((msg) => {});
});

chrome.storage.local.get(["login"], async (res) => {
  db.table("records").toArray().then(console.log);

  if (res["login"]) {
    const login = res["login"];

    const host = login.host;
    const username = login.username;
    const password = login.password;

    const allContent: AllContentResponse = await fetchAllContent(
      host,
      username,
      password
    );

    addRecordToDb(db, allContent.courses, allContent.gradingPeriods);
  }
});
