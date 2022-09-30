import { startExternalConnection, startInternalConnection } from "./connector";
import { startDatabase } from "./database";

const database = startDatabase();

startInternalConnection(database);
startExternalConnection(database);
