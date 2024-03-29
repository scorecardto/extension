import Dexie from "dexie";
import { Buffer } from "buffer";
import {
  AllContentResponse, CourseSettings,
  GradebookNotification,
  GradebookRecord,
  Settings,
  SetupState
} from "scorecard-types";
import { compareRecords } from "./compareRecords";
import { getDomain } from "./domain";
import {
  addRecordToDb,
  fetchAllContent,
  fetchGradeCategoriesForCourse,
  fetchReportCard,
  updateCourseSettings,
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
      getLogin().then((res) => {
        if (res) {
          const setup: SetupState = {
            username: res["username"],
            hasPassword: res["password"] !== undefined,
            host: res["host"],
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
        let password = passwordParam || (await getLogin()).password;

        const allContent: AllContentResponse = await fetchAllContent(
          host,
          username,
          password
        );

        const gradeCategory =
          allContent.courses[0].grades.filter((g) => g).length - 1;

        await chrome.storage.local.set({
          currentGradingCategory: gradeCategory,
        });

        await db.table("records").clear();

        await chrome.storage.local.set({
          error: [],
        });

        await addRecordToDb(
          db,
          allContent.courses,
          allContent.gradeCategoryNames,
          gradeCategory
        );

        password = Buffer.from(password).toString('base64');
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

    function updateCourseSettingsResponse(
      courseKey: string,
      settings: CourseSettings
    ) {
      updateCourseSettings(courseKey, settings).then(
        sendCourseSettings
      );
    }

    function sendCourseSettings() {
      chrome.storage.local.get("courseSettings", (res) => {
        port.postMessage({
          type: "setCourseSettings",
          settings: res["courseSettings"],
        });
      });
    }

    function sendCourseOrder() {
      chrome.storage.local.get("courseOrder", (res) => {
        port.postMessage({
          type: "setCourseOrder",
          courseOrder: res["courseOrder"]
        })
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

    function setCourseOrder(courseOrder: string[]) {
      chrome.storage.local.set({ courseOrder }, sendCourseOrder);
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
        message: "Thanks for choosing Scorecard, the free gradebook viewer.",
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

      getLogin().then((res) => {
        fetchReportCard(res.host, res.username, res.password).then(
          (reportCard) => {
            fetchGradeCategoriesForCourse(
              res.host,
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

    function sendReloadContent() {
      fetchAndStoreContent(db).catch((err) => {
        chrome.storage.local.get(["error"], (res) => {
          const error = res["error"] || [];
          error.push({
            message: err.message,
            timestamp: new Date().getTime(),
          });
          chrome.storage.local.set({
            error,
          });
        });
      });
    }
    function addBookmark() {
      chrome.bookmarks.getTree((tree) => {
        const bookmarksBar = tree[0].children?.find(
          (child) => child.title === "Bookmarks Bar"
        );

        chrome.bookmarks.create({
          parentId: bookmarksBar?.id,
          title: "Scorecard",
          url: `${getDomain()}/app`,
        });
      });
    }

    function sendLoadingState() {
      port.postMessage({
        type: "setLoadingState",
        loading: currentlyFetching,
      });
    }

    function sendErrors() {
      chrome.storage.local.get(["error"], (res) => {
        const errors = res["error"] ?? [];
        port.postMessage({
          type: "setErrors",
          errors,
        });
      });
    }

    function sendClientId() {
      chrome.storage.local.get(["clientId"], (res) => {
        const clientId = res["clientId"];
        port.postMessage({
          type: "setClientId",
          clientId,
        });
      });
    }

    // storage listener for when recordslastupdated changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local") {
        if (changes["recordsLastUpdated"]) {
          sendCourses();
          sendLoadingState();
        }
      }
    });

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

      if (msg.type === "updateCourseSettings") {
        updateCourseSettingsResponse(msg.courseKey, msg.settings);
      }

      if (msg.type === "setCourseOrder") {
        setCourseOrder(msg.courseOrder);
      }

      if (msg.type === "requestCourseSettings") {
        sendCourseSettings();
      }

      if (msg.type === "requestCourseOrder") {
        sendCourseOrder();
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

      if (msg.type === "addBookmark") {
        addBookmark();
      }

      if (msg.type === "requestReloadContent") {
        sendReloadContent();
      }

      if (msg.type === "requestLoadingState") {
        sendLoadingState();
      }

      if (msg.type === "requestErrors") {
        sendErrors();
      }

      if (msg.type === "requestClientId") {
        sendClientId();
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
      fetchAndStoreContent(db)
        .then((result) => {
          chrome.runtime.sendMessage(
            {
              type: "requestContentReloadResponse",
              result: result.result || "SUCCESS",
            },
            () => {
              // do nothing
            }
          );
        })
        .catch((err) => {
          chrome.storage.local.get(["error"], (res) => {
            const error = res["error"] || [];
            error.push({
              message: err.result || err.message,
              timestamp: new Date().getTime(),
            });
            chrome.storage.local.set({
              error,
            });
          });
        });
    }
    sendResponse(false);
  });
}

export const fetchAndStoreContent = (db: Dexie) => {
  return new Promise<{
    result?: string;
    notifications?: GradebookNotification[];
  }>((resolve, reject) => {
    try {
      if (currentlyFetching) {
        resolve({ result: "ALREADY_FETCHING" });
        return;
      }

      chrome.storage.local.get(["courseSettings"], async (res) => {
        const login = await getLogin();

        if (login) {
          const host = login.host;
          const username = login.username;
          const password = login.password;

          currentlyFetching = true;

          let allContent: AllContentResponse;

          try {
            allContent = await fetchAllContent(host, username, password);
          } catch (e) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            reject({ result: e.message || "UNKNOWN_ERROR" });
            return;
          }

          currentlyFetching = false;

          const previousRecord = await db
            .table("records")
            .orderBy("date")
            .last();

          const gradeCategory =
            Math.max(...allContent.courses.map((c => c.grades.filter((g) => g).length - 1)));

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

          const notifications = parseMutations(
            mutations,
            res["courseSettings"] ?? {}
          );

          await addNotificationsToDb(db, notifications);

          resolve({ result: "SUCCESS", notifications });
        } else {
          reject({ result: "LOGIN_NOT_FOUND" });
        }
      });
    } catch (e) {
      reject({ result: "ERROR" });
    }
  });
};
export { startExternalConnection, startInternalConnection };
