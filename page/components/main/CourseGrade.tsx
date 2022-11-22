import React from "react";
import { getDomain } from "../../../src/domain";
import Chip from "./Chip";

function CourseGrade(props: { courseName: string; grade: string }) {
  return (
    <div
      onClick={() => {
        chrome.tabs.create({
          url: `${getDomain()}/app#${props.courseName}`,
        });
      }}
      className="group flex justify-between items-center border-b last:border-b-0 border-b-mono-200 py-2 px-4 hover:bg-mono-150 cursor-pointer overflow-hidden"
    >
      <p>{props.courseName}</p>

      <div className="from-accent-500 to-accent-600 bg-gradient-to-tr w-12 text-center py-1.5 rounded-full">
        <p className="hidden group-hover:block text-xs text-white">
          {props.grade}
        </p>
        <p className="block group-hover:hidden text-xs text-white">. . .</p>
      </div>
    </div>
  );
}

export default CourseGrade;
