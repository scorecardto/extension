import axios from "redaxios";
import { UAParser } from "ua-parser-js";

const DOMAIN = "https://scorecardgrades.com";

export async function handleInstall(
  installDate: Date,
  extensionVersion: string
) {
  const uaParser = new UAParser();
  const browser = uaParser.getBrowser();
  const os = uaParser.getOS();
  const device = uaParser.getDevice();
  const engine = uaParser.getEngine();

  const res = await axios.post(`${DOMAIN}/api/metrics/install`, {
    installDate,
    extensionVersion,
    browser,
    os,
    device,
    engine,
  });

  const clientId = res.data["clientId"];

  return clientId;
}

export async function handleUninstall() {
  chrome.storage.local.get(["clientId"], async (res) => {
    const clientId = res["clientId"];

    let url = `${DOMAIN}/uninstall?loginStorage=local&gradeStorage=local`;

    if (clientId) {
      url += `&clientId=${clientId}`;
    }

    chrome.runtime.setUninstallURL(url);
  });
}
