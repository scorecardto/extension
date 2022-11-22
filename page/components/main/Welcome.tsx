import React from "react";
import { getDomain } from "../../../src/domain";

function Welcome() {
  return (
    <div className="fixed bg-accent-100 w-full h-full">
      <div className="flex flex-col h-full">
        <div className="p-4 flex flex-col gap-4">
          <img
            src={chrome.runtime.getURL("assets/icons/lg.png")}
            className="w-8 h-8"
          />
          <h1 className="text-xl font-bold">Welcome to Scorecard</h1>
          <p>{"Thanks for installing! Let's get you set up."}</p>
        </div>
        <div className="h-full flex justify-center items-center pb-12">
          <a
            href={`
    ${getDomain()}/app/connect-account?hidden-action=setup
    `}
            target="_blank"
            rel="noreferrer"
          >
            <div className="bg-accent-400 text-white rounded-md py-2 px-4 text-base">
              Get Started
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
