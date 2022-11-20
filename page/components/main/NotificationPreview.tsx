import { AnimatePresence, MotionConfig } from "framer-motion";
import React, { useContext } from "react";
import { IoChevronForwardOutline } from "react-icons/io5";
import { NotificationContext } from "scorecard-types";
import Notification from "./Notification";
import { motion } from "framer-motion";

function NotificationsPreview() {
  const notificationContext = useContext(NotificationContext);
  const { notifications, unreadNotifications } = notificationContext;

  const currentNotificationId = unreadNotifications[0]?.id;

  const showingNotification = !!unreadNotifications[0];

  return (
    <div>
      <div>
        <div className="relative pr-4">
          {notifications.map((notification, i) => {
            return (
              <>
                <AnimatePresence>
                  {currentNotificationId === notification.id && (
                    <Notification
                      notification={notification}
                      key={i}
                      index={i}
                    />
                  )}
                </AnimatePresence>
              </>
            );
          })}
          {showingNotification && (
            <div
              className="absolute top-1/2 right-0 -translate-y-1/2 bg-accent-300 hover:bg-accent-400 cursor-pointer border border-accent-400 w-8 h-8 rounded-full flex items-center justify-center"
              onClick={() => {
                notificationContext.markRead();
              }}
            >
              <IoChevronForwardOutline className="" />
            </div>
          )}
        </div>
        <div className="px-8">
          <motion.div
            className="text-center bg-mono-150 border-b border-x border-mono-200 flex items-center text-mono-400"
            variants={{
              showingNotification: {
                width: "100%",
                height: "12px",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
                borderBottomLeftRadius: "16px",
                borderBottomRightRadius: "16px",
              },
              noNotification: {
                borderTopWidth: "1px",
                height: "32px",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
                borderBottomLeftRadius: "16px",
                borderBottomRightRadius: "16px",
              },
            }}
            animate={
              showingNotification ? "showingNotification" : "noNotification"
            }
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            {!showingNotification && (
              <p className="w-full">View Past Notifications</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPreview;
