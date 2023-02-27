import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Main from "./components/main/Main";
import {
  CourseSettings,
  DataContext,
  GradebookNotification,
  NotificationContext
} from "scorecard-types";
import { GradebookRecord } from "scorecard-types";
import { LoadingContext } from "scorecard-types";
import Loading from "./components/util/context/Loading";
import Welcome from "./components/main/Welcome";
import { startDatabase } from "../src/database";
import { IndexableType } from "dexie";
import { getLogin } from "../src/util";
import { updateCourseSettings } from "../src/fetcher";

function App() {
  const [data, setData] = useState<GradebookRecord | null>(null);
  const [gradeCategory, setGradeCategory] = useState<number>(0);
  const [courseSettings, setCourseSettings] = useState<{
    [key: string]: CourseSettings;
  }>({});

  const dataContext = useMemo(
    () => ({
      data,
      setData,
      gradeCategory,
      setGradeCategory,
      courseSettings,
      setCourseSettings,
    }),
    [
      data,
      gradeCategory,
      setGradeCategory,
      courseSettings,
      setCourseSettings,
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
    // TODO: only have to have this extra fetch to migrate old local data
    chrome.storage.local.get(
      ["courseDisplayNames", "coursesLastUpdated"],
      async (result) => {
        if (result.courseDisplayNames) {
          for (const key of Object.keys(result.courseDisplayNames)) {
            await updateCourseSettings(key, { displayName: result.courseDisplayNames[key] });
          }

          await chrome.storage.local.remove("courseDisplayNames");
        }
        if (result.coursesLastUpdated) {
          for (const key of Object.keys(result.coursesLastUpdated)) {
            await updateCourseSettings(key, { lastUpdated: result.coursesLastUpdated[key] });
          }

          await chrome.storage.local.remove("coursesLastUpdated");
        }

        chrome.storage.local.get(
          ["currentGradingCategory", "courseSettings"],
          (result) => {
            if (result.currentGradingCategory) {
              setGradeCategory(result.currentGradingCategory);
            }
            if (result.courseSettings) {
              setCourseSettings(result.courseSettings);
            }
          }
        );
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
    getLogin().then((result) => {
      setLogin(
        !!result &&
          !!result.username &&
          !!result.password &&
          !!result.host
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
