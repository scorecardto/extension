import React, { useContext, useEffect, useState } from "react";
import Loading from "../util/context/Loading";
import { LoadingContext } from "scorecard-types/LoadingContext";
import Chip from "./Chip";

function TopContainer() {
  const { loading } = useContext(LoadingContext);
  const [animate, setAnimate] = useState(false);

  const [topContent, setTopContent] = useState(<></>);

  useEffect(() => {
    if (loading) {
      setAnimate(true);
    }
  }, [loading]);

  // useEffect(() => {
  //   if (loading) {
  //     setTopContent(
  //       <div className="animate-slide-sm-left">
  //         <Loading />
  //       </div>
  //     );
  //   } else if (animate) {
  //     setTopContent(
  //       <div className="animate-slide-sm-left">
  //         <p className="text-mono-500 text-lg font-semibold">Scorecard</p>
  //       </div>
  //     );
  //   } else {
  //     setTopContent(
  //       <div>
  //         <p className="text-mono-500 text-lg font-semibold">Scorecard</p>
  //       </div>
  //     );
  //   }
  // }, [loading, animate]);

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
          /* do nothing */
        }}
      >
        Open in Fullscreen
      </Chip>
    </div>
  );
}

export default TopContainer;
