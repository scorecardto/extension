import React, { useContext } from "react";
import { DataContext } from "../util/context/DataContext";
import CourseGrade from "./CourseGrade";

function Courses() {
  const { data } = useContext(DataContext);

  return (
    <div>
      {data ? (
        <div className="border border-mono-200 rounded-xl mt-14 mb-52 mx-3">
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
          <CourseGrade courseName="Course" grade="100" />
        </div>
      ) : (
        <div>Nothing loaded yet.</div>
      )}
    </div>
  );
}

export default Courses;
