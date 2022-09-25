import React, { useContext } from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { Course } from "scorecard-types";
import { DataContext } from "../util/context/DataContext";
import ContentReloadButton from "./ContentReloadButton";
import CourseGrade from "./CourseGrade";
import LastUpdated from "./LastUpdated";

function Courses() {
  const data = useContext(DataContext);

  const courses: Course[] | undefined = data.data?.data;

  // const gradingPeriods = data.data?.gradingPeriods;

  return (
    <div>
      {courses ? (
        <div className="mt-14 mb-52 mx-3">
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
        <div>Nothing loaded yet.</div>
      )}
    </div>
  );
}

export default Courses;
