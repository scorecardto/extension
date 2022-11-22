import React from "react";
import { getDomain } from "../../../src/domain";
import Chip from "./Chip";

export default function ErrorBar() {
  return (
    <div className="fixed w-full top-0 left-0 z-10">
      <div className="flex justify-between items-center bg-red-50 p-3 fixed top-0 left-0 w-full">
        <p className="text-red-500 text-sm font-medium">
          There are Unresolved Errors
        </p>
        <a
          href={`
    ${getDomain()}/app/errors
    `}
          target="_blank"
          rel="noreferrer"
        >
          <div
            className={`bg-red-100 text-red-500 border-red-200 hover:bg-red-200 py-1.5 px-4 whitespace-nowrap rounded-full border transition-colors cursor-pointer text-xs`}
          >
            Fix Errors
          </div>
        </a>
      </div>
    </div>
  );
}
