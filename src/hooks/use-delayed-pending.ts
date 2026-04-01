"use client";

import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 140;

export const useDelayedPending = (
  pending: boolean,
  delayMs = DEFAULT_DELAY_MS
) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [pending, delayMs]);

  return visible;
};
