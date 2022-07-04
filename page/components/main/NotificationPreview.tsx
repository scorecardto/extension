import Notification from "./Notification";

function NotificationsPreview() {
  return (
    <div>
      <Notification />
      <div className="px-4">
        <div className="bg-mono-150 border-b border-x border-mono-300 w-full h-3 rounded-b-2xl"></div>
      </div>
    </div>
  );
}

export default NotificationsPreview;
