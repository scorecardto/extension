import { startBackgroundSync } from "./backgroundSync";
import { startExternalConnection, startInternalConnection } from "./connector";
import { startDatabase } from "./database";
import { handleUninstall } from "./metrics";
import { checkSettings } from "./settings";
import versionManager from "./versionManager";
import { addNotificationClickHandler } from "./notifications";

const database = startDatabase();

addNotificationClickHandler();

startInternalConnection(database);
startExternalConnection(database);

handleUninstall();
versionManager();

startBackgroundSync(database);

checkSettings();
