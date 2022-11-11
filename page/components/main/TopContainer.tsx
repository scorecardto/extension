import React, { useContext, useEffect, useState } from "react";
import Loading from "../util/context/Loading";
import { DataContext, LoadingContext } from "scorecard-types";
import Chip from "./Chip";
import GradingPeriodSelector from "./GradingCategorySelector";

function TopContainer(props: {
  editingGradingCategory: boolean;
  setEditingGradingCategory: (editingGradingCategory: boolean) => void;
}) {
  const data = useContext(DataContext);

  const { loading } = useContext(LoadingContext);
  const [animate, setAnimate] = useState(false);

  const [topContent, setTopContent] = useState(<></>);

  useEffect(() => {
    if (loading) {
      setAnimate(true);
    }
  }, [loading]);

  return (
    <div className="flex justify-between items-center bg-mono-100 p-3 fixed top-0 left-0 w-full">
      <div className="flex items-center gap-4">
        <img
          src={chrome.runtime.getURL("assets/icons/md.png")}
          className="w-6 h-6"
        />
        <div>
          <div className={`${loading ? "animate-slide-sm-left" : "hidden"}`}>
            <Loading />
          </div>
          <div
            className={`${!loading && animate ? "animate-slide-sm-left" : ""} ${
              loading ? "hidden" : ""
            }`}
          >
            <p className="text-mono-500 text-lg font-semibold">Scorecard</p>
          </div>
        </div>
      </div>
      <Chip
        highlighted={false}
        onClick={() => {
          props.setEditingGradingCategory(true);
        }}
      >
        {data.data?.gradeCategoryNames[data.gradeCategory] ?? "Loading..."}
      </Chip>
    </div>
  );
}

export default TopContainer;
