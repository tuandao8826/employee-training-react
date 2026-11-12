import React, { useEffect, useState } from "react";

const shortDate = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const longDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" });

export default function CurrentDate({ long = false }) {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const refresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      setToday(now);
      timer = window.setTimeout(refresh, nextMidnight - now);
    };

    refresh();
    return () => window.clearTimeout(timer);
  }, []);

  const text = long
    ? longDate.format(today).toLocaleUpperCase("vi-VN")
    : shortDate.format(today);

  return <span>{text}</span>;
}
