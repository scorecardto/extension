import { IoSettingsOutline } from "react-icons/io5";

function SettingsButton() {
  return (
    <div className="bg-accent-100 border border-accent-200 rounded-lg py-2 text-accent-300 flex gap-2 px-4 items-center group hover:bg-accent-200 transition-colors cursor-pointer">
      <IoSettingsOutline className="text-base transition-transform group-hover:rotate-45" />
      <span>Settings</span>
    </div>
  );
}

export default SettingsButton;
