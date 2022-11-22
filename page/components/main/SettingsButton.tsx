import type React from "react";
import { IoSettingsOutline } from "react-icons/io5";
import { getDomain } from "../../../src/domain";

function SettingsButton() {
  return (
    <a
      href={`
    ${getDomain()}/app/preferences
    `}
      target="_blank"
      rel="noreferrer"
    >
      <div className="bg-accent-100 border border-accent-200 rounded-lg py-2 text-accent-300 flex gap-2 px-4 items-center group hover:bg-accent-200 transition-colors cursor-pointer">
        <IoSettingsOutline className="text-base transition-transform group-hover:rotate-45" />
        <span>Settings</span>
      </div>
    </a>
  );
}

export default SettingsButton;
