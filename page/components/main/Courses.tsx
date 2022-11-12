import React, { useContext } from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { Course } from "scorecard-types";
import { DataContext } from "scorecard-types";
import Loading from "../util/context/Loading";
import { LoadingContext } from "scorecard-types";
import ContentReloadButton from "./ContentReloadButton";
import CourseGrade from "./CourseGrade";
import LastUpdated from "./LastUpdated";

function Courses() {
  const data = useContext(DataContext);
  const loading = useContext(LoadingContext);

  const courses: Course[] | undefined = data.data?.courses;

  // const gradingCategories = data.data?.gradingCategories;

  return (
    <div className="mt-14 mx-3 pb-52">
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
