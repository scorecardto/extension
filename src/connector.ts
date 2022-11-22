import Dexie from "dexie";
import {
  AllContentResponse,
  GradebookNotification,
  GradebookRecord,
  Settings,
  SetupState,
} from "scorecard-types";
import { compareRecords } from "./compareRecords";
import {
  addRecordToDb,
  fetchAllContent,
  fetchGradeCategoriesForCourse,
  fetchReportCard,
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

        const gradeCategory =
          allContent.courses[0].grades.filter((g) => g).length - 1;

        await db.table("records").clear();

        await addRecordToDb(
          db,
          allContent.courses,
          allContent.gradeCategoryNames,
          gradeCategory
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
          gradeCategory: res["currentGradingCategory"],
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

    function sendSettings() {
      chrome.storage.local.get(["settings"], (res) => {
        port.postMessage({
          type: "setSettings",
          settings: res["settings"],
        });
      });
    }

    function setSettings(settings: Settings) {
      chrome.storage.local
        .set({
          settings,
        })
        .then(() => {
          port.postMessage({
            type: "setSettingsResponse",
            result: "SUCCESS",
          });
        })
        .catch(() => {
          port.postMessage({
            type: "setSettingsResponse",
            result: "ERROR",
          });
        });
    }

    function enableNotifications() {
      // modify settings in storage
      chrome.storage.local.get(["settings"], (res) => {
        const settings = res["settings"] ?? {};
        settings.usePushNotifications = true;
        chrome.storage.local.set({
          settings,
        });
      });

      // push a notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icons/lg.png"),
        title: "Notifications Appear Here",
        message: "Thanks for chosing Scorecard, the free gradebook viewer.",
      });
    }

    async function sendAlternateGradingPeriod(
      courseKey: string,
      gradeCategory: number
    ) {
      const record: GradebookRecord = await db
        .table("records")
        .orderBy("date")
        .last();

      const course = record.courses.find((c) => c.key === courseKey);

      const grade = course?.grades[gradeCategory]?.key;

      if (!grade) {
        port.postMessage({
          courseKey,
          gradeCategory,
          type: "setAlternateGradingPeriod",
          gradeCategories: [],
        });
        return;
      }

      chrome.storage.local.get(["login"], (res) => {
        const login = res["login"];

        fetchReportCard(login.host, login.username, login.password).then(
          (reportCard) => {
            fetchGradeCategoriesForCourse(
              login["host"],
              reportCard.sessionId,
              reportCard.referer,
              {
                ...course,
                key: grade,
              }
            ).then((gradeCategories) => {
              port.postMessage({
                courseKey,
                gradeCategory,
                type: "setAlternateGradingPeriod",
                gradeCategories: gradeCategories?.gradeCategories,
              });
            });
          }
        );
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

      if (msg.type === "requestSettings") {
        sendSettings();
      }

      if (msg.type === "setSettings") {
        setSettings(msg.settings);
      }

      if (msg.type === "enableNotifications") {
        enableNotifications();
      }

      if (msg.type === "requestAlternateGradingPeriod") {
        sendAlternateGradingPeriod(msg.courseKey, msg.gradeCategory);
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
            result: result.result || "SUCCESS",
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

export const fetchAndStoreContent = (db: Dexie) => {
  return new Promise<{
    result?: string;
    notifications?: GradebookNotification[];
  }>((resolve) => {
    if (currentlyFetching) {
      resolve({ result: "ALREADY_FETCHING" });
      return;
    }

    chrome.storage.local.get(["login"], async (res) => {
      if (res["login"]) {
        const login = res["login"];

        const host = login.host;
        const username = login.username;
        const password = login.password;

        currentlyFetching = true;

        console.log("fetching all");
        const allContent: AllContentResponse = await fetchAllContent(
          host,
          username,
          password
        );

        currentlyFetching = false;

        const previousRecord = await db.table("records").orderBy("date").last();

        const gradeCategory =
          allContent.courses[0].grades.filter((g) => g).length - 1;

        await chrome.storage.local.set({
          currentGradingCategory: gradeCategory,
        });

        const currentRecord = await addRecordToDb(
          db,
          allContent.courses,
          allContent.gradeCategoryNames,
          gradeCategory
        );

        const mutations = compareRecords(previousRecord, currentRecord);

        const notifications = parseMutations(mutations);

        await addNotificationsToDb(db, notifications);

        resolve({ result: "SUCCESS", notifications });
      } else {
        resolve({ result: "LOGIN_NOT_FOUND" });
      }
    });
  });
};
export { startExternalConnection, startInternalConnection };
