import { handleInstall } from "./metrics";

const WELCOME_URL = "https://www.scorecard-iota.vercel.app/app/connect-account";
const CURRENT_VERSION = chrome.runtime.getManifest().version;

function storeVersion(version: string) {
  localStorage.setItem("version", version);
}

function storeInstallDate() {
  localStorage.setItem("installDate", new Date().toString());
}

export default function versionManager() {
  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
      chrome.tabs.create({ url: WELCOME_URL });

      storeVersion(CURRENT_VERSION);

      storeInstallDate();

      handleInstall(new Date()).then((clientId) => {
        localStorage.setItem("clientId", clientId);
      });
    }

    if (details.reason === "update") {
      const previousVersion = details.previousVersion;

      if (previousVersion !== CURRENT_VERSION) {
        storeVersion(CURRENT_VERSION);
      }
    }
  });
}
