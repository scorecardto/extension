import { IoTrendingUp } from "react-icons/io5";

function Notification() {
  return (
    <div className="w-full h-[122px] border border-mono-300 rounded-xl flex items-center px-4 gap-4">
      <div className="flex-none p-2">
        <IoTrendingUp className="text-4xl text-accent-300" />
      </div>
      <div className="flex flex-col gap-2">
        <p>
          <b>Notifications Appear Here</b>
        </p>
        <p className="h-[60px] overflow-hidden whitespace-normal overflow-ellipsis">
          Thank you for chosing Scorecard to view your grades. We will never
          track or run ads with your data.
        </p>
      </div>
    </div>
  );
}

export default Notification;
