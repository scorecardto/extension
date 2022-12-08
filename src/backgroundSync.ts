import Dexie from "dexie";
import { fetchAndStoreContent } from "./connector";
import { getDomain } from "./domain";

const DEFAULT_FREQUENCY_MINUTES = 30;
let NOTIF_ID = 0;

export function startBackgroundSync(db: Dexie) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "fetchGrades") {
      chrome.storage.local.get(["settings", "error"], (res) => {
        fetchAndStoreContent(db)
          .then((result) => {
            if (res["settings"]?.["usePushNotifications"]) {
              if (result.notifications && result.notifications.length > 0) {
                result.notifications.forEach(async (notification) => {
                  chrome.notifications.create(notification.course+"|"+(NOTIF_ID++),{
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("assets/icons/lg.png"),
                    title: notification.title,
                    message: notification.message,
                  });
                });
              }
            }
          })
          .catch((err) => {
            const error = res["error"] || [];
            error.push({
              message: err.message,
              timestamp: new Date().getTime(),
            });
          });
      });
    }
  });
  chrome.storage.local.get(["settings"], (res) => {
    const settings = res["settings"];
    if (settings?.checkGradesInterval) {
      chrome.alarms.create("fetchGrades", {
        periodInMinutes: settings.checkGradesInterval,
      });
    } else {
      chrome.alarms.create("fetchGrades", {
        periodInMinutes: DEFAULT_FREQUENCY_MINUTES,
      });
    }
  });

  // listen for updates to chrome storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes["settings"]) {
      const settings = changes["settings"].newValue;
      if (settings?.checkGradesInterval) {
        chrome.alarms.create("fetchGrades", {
          periodInMinutes: settings.checkGradesInterval,
        });
      } else {
        chrome.alarms.create("fetchGrades", {
          periodInMinutes: DEFAULT_FREQUENCY_MINUTES,
        });
      }
    }
  });
}
