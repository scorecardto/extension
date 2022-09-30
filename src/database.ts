import Dexie from "dexie";

function startDatabase(): Dexie {
  const db = new Dexie("scorecard");

  db.version(1).stores({
    records: "++id, date, data, gradingPeriods",
  });

  return db;
}

export { startDatabase };
