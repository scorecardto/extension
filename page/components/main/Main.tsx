import React from "react";
import BottomContainer from "./BottomContainer";
import Courses from "./Courses";
import TopContainer from "./TopContainer";

function Main() {
  return (
    <div className="relative">
      <TopContainer />

      <Courses />

      <BottomContainer />
    </div>
  );
}

export default Main;
