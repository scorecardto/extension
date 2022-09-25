import React, { useEffect, useState } from "react";

export default function LastUpdated(props: { date: Date }) {
  const [text, setText] = useState("Click to Reload");

  const update = (): string => {
    const then = props.date.getTime();
    const now = Date.now();

    const min = Math.floor((now - then) / 1000 / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);

    if (min < 2) {
      return "Up to date";
    }
    if (min < 60) {
      return `Updated  ${min} minutes ago`;
    }
    if (hour < 24) {
      if (hour === 1) {
        return `Updated 1 hour ago`;
      }
      return `Updated ${hour} hours ago`;
    }
    if (day === 1) {
      return `Updated yesterday`;
    }
    if (day < 7) {
      return `Updated ${new Date().toLocaleString("en-us", {
        weekday: "long",
      })}`;
    }
    return `Updated ${props.date.toLocaleString("en-us", {
      month: "short",
      day: "numeric",
    })}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setText(update());
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setText(update());
  }, [props.date]);

  return <div>{text}</div>;
}
