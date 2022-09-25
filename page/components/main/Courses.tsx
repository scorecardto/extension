import React, { useContext } from "react";
import { Course, CourseAssignments } from "scorecard-types";
import { DataContext } from "../util/context/DataContext";
import CourseGrade from "./CourseGrade";

function Courses() {
  const data = useContext(DataContext);

  const courses: Course[] | undefined = data.data?.data;

  const gradingPeriods = data.data?.gradingPeriods;

  return (
    <div>
      {courses ? (
        <div className="border border-mono-200 rounded-xl mt-14 mb-52 mx-3">
          {/* {gradingPeriods ? (
            
          ) : (
           
          )} */}
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
      ) : (
        <div>Nothing loaded yet.</div>
      )}
    </div>
  );
}

export default Courses;
