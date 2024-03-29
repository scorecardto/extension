import { getDomain } from "./domain";
import { handleInstall, handleUninstall } from "./metrics";

const WELCOME_URL = `${getDomain()}/app/connect-account?hidden-action=setup`;
const CURRENT_VERSION = chrome.runtime.getManifest().version;

function storeVersion(version: string) {
  chrome.storage.local.set({ version: version });
}

function storeInstallDate() {
  chrome.storage.local.set({ installDate: new Date().toString() });
}

export default function versionManager() {
  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
      chrome.cookies.set(
        {
          url: getDomain(),
          name: "EXT_ID",
          value: chrome.runtime.id,
          // expires in 10 years
          expirationDate: Date.now() + 10 * 365 * 24 * 60 * 60,
        },
        () => {
          chrome.tabs.create({ url: WELCOME_URL });
        }
      );
      storeVersion(CURRENT_VERSION);
      storeInstallDate();

      handleInstall(new Date(), CURRENT_VERSION)
        .then((clientId) => {
          chrome.storage.local.set({ clientId: clientId }).then(() => {
            handleUninstall();
          });
        })
        .catch((err) => {
          console.log("Error occured while creating clientId", err);
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
