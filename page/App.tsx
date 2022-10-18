import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import { DataContext } from "scorecard-types";
import { GradebookRecord } from "scorecard-types";
import Dexie from "dexie";
import { LoadingContext } from "scorecard-types";
import Loading from "./components/util/context/Loading";
import Welcome from "./components/main/Welcome";

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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data?.data[0]) {
      const length = data.data[0].grades.filter((g) => g).length;

      if (length) {
        setGradingPeriod(Math.max(0, length - 1));
      }

      const TEN_MINUTES = 1000 * 60 * 10;

      if (data.date < Date.now() - TEN_MINUTES) {
        reloadContent();
      }
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
      () => {
        // do nothing
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const listener = (request: any, sender: any, sendResponse: any) => {
      if (request.type === "requestContentReloadResponse") {
        if (request.result === "SUCCESS") {
          setLoading(false);
        } else {
          console.log(request.result);
        }
        chrome.runtime.onMessage.removeListener(listener);
      }
      sendResponse(false);
    };

    chrome.runtime.onMessage.addListener(listener);
  };

  const [login, setLogin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    chrome.storage.local.get(["login"], (result) => {
      setLogin(
        !!result.login &&
          !!result.login.username &&
          !!result.login.password &&
          !!result.login.host
      );
    });
  }, []);

  return (
    <div>
      <LoadingContext.Provider value={{ loading, setLoading, reloadContent }}>
        <DataContext.Provider value={dataContext}>
          <>
            {(() => {
              if (login === undefined) {
                return <Loading />;
              } else if (login === true) {
                return <Main />;
              } else {
                return <Welcome />;
              }
            })()}
          </>
        </DataContext.Provider>
      </LoadingContext.Provider>
    </div>
  );
}

export default App;
