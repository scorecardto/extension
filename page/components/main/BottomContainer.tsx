import React from "react";

import NotificationsPreview from "./NotificationPreview";
import SettingsButton from "./SettingsButton";

function BottomContainer() {
  return (
    <div className="fixed bottom-0 left-0 w-full">
      <div className="flex flex-col gap-3 p-3 bg-mono-100">
        <SettingsButton />
        <NotificationsPreview />
      </div>
    </div>
  );
}

export default BottomContainer;
