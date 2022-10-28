import Dexie from "dexie";

function startDatabase(): Dexie {
  const db = new Dexie("scorecard");

  db.version(1.1).stores({
    records: "++id, date, courses, gradeCategoryNames",
  });

  return db;
}

export { startDatabase };
