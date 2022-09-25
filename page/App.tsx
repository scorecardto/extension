import React, { useEffect, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import { DataContext } from "./components/util/context/DataContext";
import { GradebookRecord } from "scorecard-types";
import Dexie from "dexie";

function App() {
  const [data, setData] = useState<GradebookRecord | null>(null);

  const [gradingPeriod, setGradingPeriod] = useState<number>(0);

  useEffect(() => {
    const length = data?.data[0].grades.filter((g) => g).length;

    if (length) {
      setGradingPeriod(Math.max(0, length - 1));
    }
  }, [data]);

  const db = new Dexie("scorecard");

  useEffect(() => {
    db.version(1).stores({
      records: "++id, date, data, gradingPeriods",
    });

    const record = db.table("records").orderBy("date").last();

    record.then(setData);
  }, []);

  return (
    <div>
      <DataContext.Provider
        value={{ data, setData, gradingPeriod, setGradingPeriod }}
      >
        <Main />
      </DataContext.Provider>
    </div>
  );
}

export default App;
