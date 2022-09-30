import React from "react";
import Chip from "./Chip";

function CourseGrade(props: { courseName: string; grade: string }) {
  return (
    <div className="flex justify-between items-center border-b last:border-b-0 border-b-mono-200 py-2 px-4">
      <p>{props.courseName}</p>

      <div className="from-accent-500 to-accent-600 bg-gradient-to-tr w-12 text-center py-1.5 rounded-full group">
        <p className="opacity-20 group-hover:opacity-100 transition-opacity text-xs text-white">
          {props.grade}
        </p>
      </div>
    </div>
  );
}

export default CourseGrade;
