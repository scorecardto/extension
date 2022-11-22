import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import {
  DataContext,
  GradebookNotification,
  NotificationContext,
} from "scorecard-types";
import { GradebookRecord } from "scorecard-types";
import { LoadingContext } from "scorecard-types";
import Loading from "./components/util/context/Loading";
import Welcome from "./components/main/Welcome";
import { startDatabase } from "../src/database";
import { IndexableType } from "dexie";

function App() {
  const [data, setData] = useState<GradebookRecord | null>(null);
  const [gradeCategory, setGradeCategory] = useState<number>(0);
  const [courseDisplayNames, setCourseDisplayNames] = useState<{
    [key: string]: string;
  }>({});

  const dataContext = useMemo(
    () => ({
      data,
      setData,
      gradeCategory,
      setGradeCategory,
      courseDisplayNames,
      setCourseDisplayNames,
    }),
    [
      data,
      gradeCategory,
      setGradeCategory,
      courseDisplayNames,
      setCourseDisplayNames,
    ]
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["settings", "error"], (result) => {
      const minutes = result.settings?.checkGradesInterval || 30;
      if (data?.courses[0] && !result.error) {
        if (data.date < Date.now() - 1000 * 60 * minutes) {
          reloadContent();
        }
      }
    });
  }, [data]);

  useEffect(() => {
    chrome.storage.local.get(
      ["currentGradingCategory", "courseDisplayNames"],
      (result) => {
        if (result.currentGradingCategory) {
          setGradeCategory(result.currentGradingCategory);
        }
        if (result.courseDisplayNames) {
          setCourseDisplayNames(result.courseDisplayNames);
        }
      }
    );

    chrome.runtime.sendMessage(
      {
        type: "getLoadingState",
      },
      (response) => {
        setLoading(response);
      }
    );
  }, []);

  const db = startDatabase();

  useEffect(() => {
    if (!loading) {
      const record = db.table("records").orderBy("date").last();

      record.then(setData);

      const notifications = db
        .table("notifications")
        .orderBy("date")
        .reverse()
        .toArray();

      notifications.then(setNotifications);
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

  const [notifications, setNotifications] = useState<GradebookNotification[]>(
    []
  );

  const notificationContext = useMemo(
    () => ({
      notifications,
      setNotifications,
      markRead: () => {
        // mark last notification as read in the database
        const lastNotification = notifications.filter((n) => !n.read)[0];

        chrome.storage.local.get("settings").then((res) => {
          const time = res.settings?.deleteNotificationsAfter;

          if (
            time !== undefined &&
            Date.now() - lastNotification.date >= time * 24 * 60 * 60 * 1000
          ) {
            db.table("notifications")
              .delete(lastNotification.id as IndexableType)
              .then(() => {
                setNotifications([...notifications]);
              });
          } else {
            lastNotification.read = true;

            db.table("notifications")
              .update(lastNotification.id, lastNotification)
              .then(() => {
                setNotifications([...notifications]);
              });
          }
        });
      },
      unreadNotifications: notifications.filter((n) => !n.read),
    }),
    [notifications]
  );

  return (
    <div>
      <LoadingContext.Provider value={{ loading, setLoading, reloadContent }}>
        <NotificationContext.Provider value={notificationContext}>
          <DataContext.Provider value={dataContext}>
            <>
              {(() => {
                if (login === undefined) {
                  return <Loading />;
                } else if (login) {
                  return <Main />;
                } else {
                  return <Welcome />;
                }
              })()}
            </>
          </DataContext.Provider>
        </NotificationContext.Provider>
      </LoadingContext.Provider>
    </div>
  );
}

export default App;
