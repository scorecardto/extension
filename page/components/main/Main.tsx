import React, { useState } from "react";
import BottomContainer from "./BottomContainer";
import Courses from "./Courses";
import GradingCategorySelector from "./GradingCategorySelector";
import TopContainer from "./TopContainer";

function Main() {
  const [editingGradingCategory, setEditingGradingCategory] = useState(false);
  return (
    <div className="relative">
      <GradingCategorySelector
        editingGradingCategory={editingGradingCategory}
        setEditingGradingCategory={setEditingGradingCategory}
      />

      <TopContainer
        editingGradingCategory={editingGradingCategory}
        setEditingGradingCategory={setEditingGradingCategory}
      />

      <Courses />

      <BottomContainer />
    </div>
  );
}

export default Main;
