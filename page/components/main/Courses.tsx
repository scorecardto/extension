import React, { useContext } from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { Course, NotificationContext } from "scorecard-types";
import { DataContext } from "scorecard-types";
import Loading from "../util/context/Loading";
import { LoadingContext } from "scorecard-types";
import ContentReloadButton from "./ContentReloadButton";
import CourseGrade from "./CourseGrade";
import LastUpdated from "./LastUpdated";

function Courses() {
  const data = useContext(DataContext);
  const loading = useContext(LoadingContext);
  const notifications = useContext(NotificationContext);

  const courses: (Course|undefined)[] | undefined = (
    data.courseOrder?.map(
      c => data.data?.courses.find((c2) => c2.key == c)
    )
    ?? data.data?.courses
  )?.filter(c => c && !data.courseSettings[c.key]?.hidden);

  return (
    <div
      className={`mt-14 mx-3 transition-all ${
        notifications.unreadNotifications.length > 0 ? "pb-52" : "pb-0"
      }`}
    >
      {courses ? (
        <div>
          <div className="border border-mono-200 rounded-xl overflow-hidden">
            {courses.map((c, i) => {
              if (!c) return;

              return (
                <CourseGrade
                  courseName={data.courseSettings[c.key]?.displayName ?? c.name}
                  courseKey={c.key}
                  grade={c.grades[data.gradeCategory]?.value || "NG"}
                  key={i}
                />
              );
            })}
          </div>
          {data.data && <ContentReloadButton lastUpdated={data.data.date} />}
        </div>
      ) : (
        <>
          {loading.loading ? (
            <Loading />
          ) : (
            <div onClick={loading.reloadContent}>Nothing loaded yet.</div>
          )}
        </>
      )}
    </div>
  );
}

export default Courses;
