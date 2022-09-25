import React, { useEffect, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import { DataContext } from "./components/util/context/DataContext";
import { GradebookRecord } from "scorecard-types";
import Dexie from "dexie";
import { MantineProvider } from "@mantine/core";

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

  db.version(1).stores({
    records: "++id, date, data, gradingPeriods",
  });

  const record = db.table("records").orderBy("date").last();

  record.then(setData);

  useEffect(() => {
    console.log(data);
  }, []);

  return (
    <div>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <DataContext.Provider
          value={{ data, setData, gradingPeriod, setGradingPeriod }}
        >
          <Main />
        </DataContext.Provider>
      </MantineProvider>
    </div>
  );
}

export default App;
