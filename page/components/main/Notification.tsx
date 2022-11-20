import React from "react";
import { IoPulse, IoTrendingDown, IoTrendingUp } from "react-icons/io5";
import { GradebookNotification } from "scorecard-types";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

function Notification(props: {
  notification: GradebookNotification;
  index: number;
}) {
  const { icon, title, message } = props.notification;
  return (
    <motion.div
      key={`notification-${props.index}`}
      initial={
        props.index === 0
          ? {}
          : {
              opacity: 0,
              translateY: 20,
              scale: 0.8,
            }
      }
      animate={{
        opacity: 1,
        translateY: 0,
        scale: 1,
      }}
      exit={{
        position: "absolute",
        bottom: 0,
        opacity: 0,
        translateX: "-100%",
        scale: 0.8,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      <div className="w-full h-[122px] border border-mono-200 rounded-xl flex items-center pl-4 pr-8 gap-4">
        <div className="flex-none p-2 text-2xl">
          {icon === "RISE" && <IoTrendingUp className="text-accent-300" />}
          {icon === "NEUTRAL" && <IoPulse className="text-accent-300" />}
          {icon === "FALL" && <IoTrendingDown className="text-accent-300" />}
        </div>
        <div className="flex flex-col gap-2">
          <p>
            <b>{title}</b>
          </p>
          <p className="h-[60px] overflow-hidden whitespace-normal overflow-ellipsis">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default Notification;
