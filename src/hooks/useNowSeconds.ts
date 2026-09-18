"use client";

import { useEffect, useState } from "react";

/** Shared one-second tick driving the accrual estimates shown between claims. */
export function useNowSeconds() {
  const [nowSeconds, setNowSeconds] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    const id = setInterval(
      () => setNowSeconds(Math.floor(Date.now() / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, []);

  return nowSeconds;
}
