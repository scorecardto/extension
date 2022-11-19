import Dexie from "dexie";

function startDatabase(): Dexie {
  const db = new Dexie("scorecard");

  db.version(1.3).stores({
    records: "++id, date, courses, gradeCategoryNames",
    notifications: "++id, icon, title, message, date, read",
  });

  return db;
}

export { startDatabase };
