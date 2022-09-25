import React, { useMemo, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import { DataContext } from "./components/util/context/DataContext";
import { GradebookRecord } from "scorecard-types";
import Dexie from "dexie";

function App() {
  const [data, setData] = useState<GradebookRecord | null>(null);

  const dataProvider = useMemo(() => ({ data, setData }), []);

  const db = new Dexie("scorecard");

  const record = db.table("records").orderBy("date").first();

  record.then(setData);

  return (
    <div>
      <DataContext.Provider value={dataProvider}>
        <Main />
      </DataContext.Provider>
    </div>
  );
}

export default App;
