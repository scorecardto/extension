import React from "react";
import { IoRefreshOutline } from "react-icons/io5";
import LastUpdated from "./LastUpdated";

export default function ContentReloadButton(props: { lastUpdated: number }) {
  return (
    <div>
      <div className="text-xs text-mono-400 flex flex-row gap-1 items-center group cursor-pointer w-fit">
        <LastUpdated date={new Date(props.lastUpdated)} />
        <div className="group-hover:bg-mono-200 p-1 rounded-md">
          <IoRefreshOutline />
        </div>
      </div>
    </div>
  );
}
