import React, { useEffect, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import { DataContext } from "./components/util/context/DataContext";
import { GradebookRecord } from "scorecard-types";
import Dexie from "dexie";
import { LoadingContext } from "./components/util/context/LoadingContext";

function App() {
  const [data, setData] = useState<GradebookRecord | null>(null);

  const [gradingPeriod, setGradingPeriod] = useState<number>(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const length = data?.data[0].grades.filter((g) => g).length;

    if (length) {
      setGradingPeriod(Math.max(0, length - 1));
    }
  }, [data]);

  const db = new Dexie("scorecard");

  useEffect(() => {
    if (!loading) {
      db.version(1).stores({
        records: "++id, date, data, gradingPeriods",
      });

      const record = db.table("records").orderBy("date").last();
      record.then(setData);
    }
  }, [loading]);

  return (
    <div>
      <LoadingContext.Provider value={{ loading, setLoading }}>
        <DataContext.Provider
          value={{ data, setData, gradingPeriod, setGradingPeriod }}
        >
          <Main />
        </DataContext.Provider>
      </LoadingContext.Provider>
    </div>
  );
}

export default App;
