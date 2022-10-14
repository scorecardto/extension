import React from "react";

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
          <div className="from-accent-500 to-accent-600 bg-gradient-to-tr text-white rounded-md py-2 px-4 text-base">
            Get started
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
