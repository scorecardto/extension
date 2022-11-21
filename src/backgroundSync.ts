import Dexie from "dexie";
import { fetchAndStoreContent } from "./connector";

const DEFAULT_FREQUENCY_MINUTES = 30;

export function startBackgroundSync(db: Dexie) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "fetchGrades") {
      console.log("Fetching grades in background ...");

      fetchAndStoreContent(db).then((result) => {
        if (result.notifications && result.notifications.length > 0) {
          result.notifications.forEach((notification) => {
            chrome.notifications.create({
              type: "basic",
              iconUrl: chrome.runtime.getURL("assets/icons/lg.png"),
              title: notification.title,
              message: notification.message,
            });
          });
        }
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
