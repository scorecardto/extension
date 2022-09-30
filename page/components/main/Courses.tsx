import React, { useContext } from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { Course } from "scorecard-types";
import { DataContext } from "../util/context/DataContext";
import Loading from "../util/context/Loading";
import { LoadingContext } from "../util/context/LoadingContext";
import ContentReloadButton from "./ContentReloadButton";
import CourseGrade from "./CourseGrade";
import LastUpdated from "./LastUpdated";

function Courses() {
  const data = useContext(DataContext);
  const loading = useContext(LoadingContext);

  const courses: Course[] | undefined = data.data?.data;

  // const gradingPeriods = data.data?.gradingPeriods;

  return (
    <div className="mt-14 mb-52 mx-3">
      {courses ? (
        <div>
          <div className="border border-mono-200 rounded-xl">
            {courses.map((c, i) => {
              return (
                <CourseGrade
                  courseName={c.name}
                  grade={c.grades[data.gradingPeriod]?.value || "NG"}
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
