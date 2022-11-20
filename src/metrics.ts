import axios from "axios";
import { UAParser } from "ua-parser-js";

export async function handleInstall(installDate: Date) {
  const uaParser = new UAParser();
  const browser = uaParser.getBrowser();
  const os = uaParser.getOS();
  const device = uaParser.getDevice();
  const engine = uaParser.getEngine();

  const res = await axios.post("/api/metrics/install", {
    installDate: installDate.getTime(),
    browser: browser,
    os: os,
    device: device,
    engine: engine,
  });

  const clientId = res.data["clientId"];

  return clientId;
}
