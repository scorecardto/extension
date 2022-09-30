import React from "react";
import { IoRefreshOutline } from "react-icons/io5";
import { LoadingContext } from "../util/context/LoadingContext";
import LastUpdated from "./LastUpdated";

export default function ContentReloadButton(props: { lastUpdated: number }) {
  const loadingContext = React.useContext(LoadingContext);

  return (
    <div className="flex justify-center pt-2">
      {loadingContext.loading ? (
        <div className="text-xs text-mono-400 flex flex-row gap-1 items-center group cursor-pointer w-fit">
          Loading
        </div>
      ) : (
        <div
          className="text-xs text-mono-400 flex flex-row gap-1 items-center group cursor-pointer w-fit"
          onClick={() => {
            loadingContext.reloadContent();
          }}
        >
          <LastUpdated date={new Date(props.lastUpdated)} />
          <div className="group-hover:bg-mono-200 p-1 rounded-md">
            <IoRefreshOutline />
          </div>
        </div>
      )}
    </div>
  );
}
