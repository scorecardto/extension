import Dexie from "dexie";
import {
  AllContentResponse,
  GradebookRecord,
  SetupState,
} from "scorecard-types";
import { addRecordToDb, fetchAllContent } from "./fetcher";
import { getLogin } from "./util";

function startExternalConnection(db: Dexie) {
  chrome.runtime.onConnectExternal.addListener((port) => {
    port.postMessage({ type: "handshake", version: 0.1 });

    function sendCourses() {
      db.table("records")
        .orderBy("date")
        .last()
        .then((record: GradebookRecord) => {
          port.postMessage({
            type: "setCourses",
            record,
          });
        });
    }

    function sendSetup() {
      chrome.storage.local.get(["login"], async (res) => {
        if (res["login"]) {
          const login = res["login"];

          const setup: SetupState = {
            username: login["username"],
            hasPassword: login["password"] !== undefined,
            host: login["host"],
          };

          port.postMessage({
            type: "setSetup",
            setup: setup,
          });
        } else {
          port.postMessage({
            type: "setSetup",
            setup: undefined,
          });
        }
      });
    }

    async function sendValidPassword(
      host: string,
      username: string,
      passwordParam: string
    ) {
      try {
        const password = passwordParam || (await getLogin())["password"];

        const allContent: AllContentResponse = await fetchAllContent(
          host,
          username,
          password
        );

        await db.table("records").clear();
        await addRecordToDb(db, allContent.courses, allContent.gradingPeriods);

        chrome.storage.local.set({
          login: {
            host,
            username,
            password,
          },
        });
        port.postMessage({
          type: "validLoginResponse",
          result: "VALID",
        });
      } catch (e: any) {
        port.postMessage({
          type: "validLoginResponse",
          result: e.message || "ERROR",
        });
      }
    }

    port.onMessage.addListener((msg) => {
      if (msg.type === "requestCourses") {
        sendCourses();
      }

      if (msg.type === "requestSetup") {
        sendSetup();
      }

      if (msg.type === "requestLoginValidation") {
        sendValidPassword(msg.host, msg.username, msg.password);
      }
      // do nothing
    });
  });
}

function startInternalConnection(db: Dexie) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "requestContentReload") {
      fetchAndStoreContent().then((result) => {
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
