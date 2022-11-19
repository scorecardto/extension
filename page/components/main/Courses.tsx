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

  const courses: Course[] | undefined = data.data?.courses;

  return (
    <div
      className={`mt-14 mx-3 transition-all ${
        notifications.notifications.length > 0 ? "pb-52" : "pb-0"
      }`}
    >
      {courses ? (
        <div>
          <div className="border border-mono-200 rounded-xl overflow-hidden">
            {courses.map((c, i) => {
              return (
                <CourseGrade
                  courseName={c.name}
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
