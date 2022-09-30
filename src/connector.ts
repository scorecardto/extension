import Dexie from "dexie";
import { AllContentResponse, GradebookRecord } from "scorecard-types";
import { addRecordToDb, fetchAllContent } from "./fetcher";

function startExternalConnection(db: Dexie) {
  chrome.runtime.onConnectExternal.addListener((port) => {
    port.postMessage({ type: "handshake", version: 0.1 });

    db.table("records")
      .orderBy("date")
      .last()
      .then((record: GradebookRecord) => {
        port.postMessage({
          type: "setCourses",
          record: record.data,
        });
      });

    port.onMessage.addListener((msg) => {
      // do nothing
    });
  });
}

function startInternalConnection(db: Dexie) {
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

          await addRecordToDb(
            db,
            allContent.courses,
            allContent.gradingPeriods
          );

          resolve(undefined);
        } else {
          resolve("LOGIN_NOT_FOUND");
        }
      });
    });
  };
}
export { startExternalConnection, startInternalConnection };
