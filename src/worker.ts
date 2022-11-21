import { startBackgroundSync } from "./backgroundSync";
import { startExternalConnection, startInternalConnection } from "./connector";
import { startDatabase } from "./database";
import { handleUninstall } from "./metrics";
import { checkSettings } from "./settings";
import versionManager from "./versionManager";

const database = startDatabase();

startInternalConnection(database);
startExternalConnection(database);

handleUninstall();
versionManager();

startBackgroundSync(database);

checkSettings();
