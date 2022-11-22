import React, { useEffect, useState } from "react";
import BottomContainer from "./BottomContainer";
import Courses from "./Courses";
import ErrorBar from "./ErrorBar";
import GradingCategorySelector from "./GradingCategorySelector";
import TopContainer from "./TopContainer";

function Main() {
  const [editingGradingCategory, setEditingGradingCategory] = useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["error"], (result) => {
      if (result.error && result.error.length && result.error.length > 0) {
        setError(true);
      }
    });
  }, []);

  return (
    <div className="relative">
      {error && <ErrorBar />}
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
