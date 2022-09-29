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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "requestContentReload") {
    const contentPromise = fetchAndStoreContent();

    contentPromise.then((result) => {
      chrome.runtime.sendMessage(
        {
          type: "requestContentReloadResponse",
          result: result || "SUCCESS",
        },
        () => {
          // do nothing
        }
      );
    });

    sendResponse(false);
  }
});

const fetchAndStoreContent = () => {
  return new Promise<string | undefined>((resolve) => {
    chrome.storage.local.get(["login"], async (res) => {
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

        await addRecordToDb(db, allContent.courses, allContent.gradingPeriods);

        resolve(undefined);
      } else {
        resolve("LOGIN_NOT_FOUND");
      }
    });
  });
};
