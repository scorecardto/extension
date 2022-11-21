import { Settings } from "scorecard-types";

const DEFAULT_SETTINGS: Settings = {
  appearance: "LIGHT",
  accentColor: "BLUE",
  usePushNotifications: false,
  checkGradesInterval: 30,
  deleteNotificationsAfter: 5,
  spoilerMode: true,
};

export function checkSettings() {
  chrome.storage.local.get(["settings"], (result) => {
    if (result.settings) {
      const settings = result.settings;

      Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
        if (settings[key] === undefined) {
          settings[key] = value;
        }
      });

      chrome.storage.local.set({
        settings,
      });
    } else {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
}
