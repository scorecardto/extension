import Dexie from "dexie";
import {
  AllContentResponse,
  GradebookRecord,
  SetupState,
} from "scorecard-types";
import {
  addRecordToDb,
  fetchAllContent,
  updateCourseDisplayName,
} from "./fetcher";
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
        await addRecordToDb(
          db,
          allContent.courses,
          allContent.gradeCategoryNames
        );

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

    function updateCourseDisplayNameResponse(
      courseKey: string,
      displayName: string
    ) {
      updateCourseDisplayName(db, courseKey, displayName).then(() => {
        sendCourses();
      });
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

      if (msg.type === "updateCourseDisplayName") {
        updateCourseDisplayNameResponse(msg.courseKey, msg.displayName);
      }
    });
  });
}

function startInternalConnection(db: Dexie) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "requestContentReload") {
      fetchAndStoreContent(db).then((result) => {
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
    }
    sendResponse(false);
  });
}

const fetchAndStoreContent = (db: Dexie) => {
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
          allContent.gradeCategoryNames
        );

        resolve(undefined);
      } else {
        resolve("LOGIN_NOT_FOUND");
      }
    });
  });
};
export { startExternalConnection, startInternalConnection };
