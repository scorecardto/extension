import { startExternalConnection, startInternalConnection } from "./connector";
import { startDatabase } from "./database";
import versionManager from "./versionManager";

const database = startDatabase();

startInternalConnection(database);
startExternalConnection(database);

versionManager();
