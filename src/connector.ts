import Dexie from "dexie";
import {
  AllContentResponse,
  GradebookNotification,
  GradebookRecord,
  SetupState,
} from "scorecard-types";
import { compareRecords } from "./compareRecords";
import {
  addRecordToDb,
  fetchAllContent,
  updateCourseDisplayName,
} from "./fetcher";
import { addNotificationsToDb, parseMutations } from "./notifications";
import { getLogin } from "./util";

let currentlyFetching = false;

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
      updateCourseDisplayName(courseKey, displayName).then(
        sendCourseDisplayNames
      );
    }

    function sendCourseDisplayNames() {
      chrome.storage.local.get("courseDisplayNames", (res) => {
        port.postMessage({
          type: "setCourseDisplayNames",
          courseDisplayNames: res["courseDisplayNames"],
        });
      });
    }

    function sendGradingCategory() {
      chrome.storage.local.get(["currentGradingCategory"], (res) => {
        port.postMessage({
          type: "setGradingCategory",
          gradingCategory: res["currentGradingCategory"],
        });
      });
    }

    function sendNotifications() {
      db.table("notifications")
        .orderBy("date")
        .reverse()
        .toArray()
        .then((notifications) => {
          port.postMessage({
            type: "setNotifications",
            notifications,
          });
        });
    }

    async function markNotificationAsRead() {
      const notifications = db.table("notifications");

      const lastNotification: GradebookNotification = await notifications
        .orderBy("date")
        .filter((notification) => !notification.read)
        .last();

      if (lastNotification) {
        notifications.update(lastNotification.id, {
          read: true,
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

      if (msg.type === "updateCourseDisplayName") {
        updateCourseDisplayNameResponse(msg.courseKey, msg.displayName);
      }

      if (msg.type === "requestCourseDisplayNames") {
        sendCourseDisplayNames();
      }

      if (msg.type === "requestGradingCategory") {
        sendGradingCategory();
      }

      if (msg.type === "requestNotifications") {
        sendNotifications();
      }

      if (msg.type === "markNotificationAsRead") {
        markNotificationAsRead();
      }
    });
  });
}

function startInternalConnection(db: Dexie) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "getLoadingState") {
      sendResponse(currentlyFetching);
    }
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
    if (currentlyFetching) {
      console.log("Already fetching");

      resolve("ALREADY_FETCHING");
      return;
    }

    chrome.storage.local.get(["login"], async (res) => {
      if (res["login"]) {
        const login = res["login"];

        const host = login.host;
        const username = login.username;
        const password = login.password;

        currentlyFetching = true;

        const allContent: AllContentResponse = await fetchAllContent(
          host,
          username,
          password
        );

        currentlyFetching = false;

        const previousRecord = await db.table("records").orderBy("date").last();

        const currentRecord = await addRecordToDb(
          db,
          allContent.courses,
          allContent.gradeCategoryNames
        );

        const mutations = compareRecords(previousRecord, currentRecord);

        const notifications = parseMutations(mutations);

        await addNotificationsToDb(db, notifications);

        resolve(undefined);
      } else {
        resolve("LOGIN_NOT_FOUND");
      }
    });
  });
};
export { startExternalConnection, startInternalConnection };
