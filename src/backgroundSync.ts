import Dexie from "dexie";
import { fetchAndStoreContent } from "./connector";

const FREQUENCY_MINUTES = 1;

export function startBackgroundSync(db: Dexie) {
  chrome.alarms.create("fetchGrades", { periodInMinutes: FREQUENCY_MINUTES });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "fetchGrades") {
      console.log("Fetching grades in background ...");

      fetchAndStoreContent(db).then((result) => {
        console.log(result);

        // send push notification if there are new notifications
        if (result.notifications && result.notifications.length > 0) {
          // send notification for each new notification
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
}
