import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import { DataContext } from "./components/util/context/DataContext";
import { GradebookRecord } from "scorecard-types";
import Dexie from "dexie";
import { LoadingContext } from "./components/util/context/LoadingContext";

function App() {
  const [data, setData] = useState<GradebookRecord | null>(null);
  const [gradingPeriod, setGradingPeriod] = useState<number>(0);

  const dataContext = useMemo(
    () => ({
      data,
      setData,
      gradingPeriod,
      setGradingPeriod,
    }),
    [data, gradingPeriod, setGradingPeriod]
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const length = data?.data[0].grades.filter((g) => g).length;

    if (length) {
      setGradingPeriod(Math.max(0, length - 1));
    }
  }, [data]);

  const db = new Dexie("scorecard");

  db.version(1).stores({
    records: "++id, date, data, gradingPeriods",
  });

  useEffect(() => {
    if (!loading) {
      const record = db.table("records").orderBy("date").last();
      record.then(setData);
    }
  }, [loading]);

  const reloadContent = () => {
    setLoading(true);

    chrome.runtime.sendMessage(
      {
        type: "requestContentReload",
      },
      (res) => {
        setLoading(false);
      }
    );
  };

  return (
    <div>
      <LoadingContext.Provider value={{ loading, setLoading, reloadContent }}>
        <DataContext.Provider value={dataContext}>
          <Main />
        </DataContext.Provider>
      </LoadingContext.Provider>
    </div>
  );
}

export default App;
