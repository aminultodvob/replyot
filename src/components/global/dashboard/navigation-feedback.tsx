"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type NavigationFeedbackContextValue = {
  startNavigation: () => void;
};

const NavigationFeedbackContext =
  createContext<NavigationFeedbackContextValue | null>(null);

const MIN_VISIBILITY_MS = 220;
const MAX_NAVIGATION_MS = 8000;

export const DashboardNavigationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const navigationIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishNavigation = useCallback(() => {
    if (!startedAtRef.current) {
      setActive(false);
      setProgress(0);
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(MIN_VISIBILITY_MS - elapsed, 0);

    clearTimers();
    setProgress(100);

    const hideTimer = window.setTimeout(() => {
      setActive(false);
      setProgress(0);
      startedAtRef.current = null;
    }, remaining + 180);

    timersRef.current.push(hideTimer);
  }, [clearTimers]);

  const startNavigation = useCallback(() => {
    navigationIdRef.current += 1;
    const navigationId = navigationIdRef.current;
    clearTimers();
    startedAtRef.current = Date.now();
    setActive(true);
    setProgress(18);

    const firstTimer = window.setTimeout(() => setProgress(52), 80);
    const secondTimer = window.setTimeout(() => setProgress(78), 240);
    const fallbackTimer = window.setTimeout(() => {
      // Prevent stale top loader when navigation doesn't complete (same route, cancelled, error).
      if (navigationIdRef.current === navigationId) {
        setProgress(92);
        finishNavigation();
      }
    }, MAX_NAVIGATION_MS);

    timersRef.current.push(firstTimer, secondTimer, fallbackTimer);
  }, [clearTimers, finishNavigation]);

  useEffect(() => {
    if (!active) {
      return;
    }

    finishNavigation();
  }, [pathname, searchParams, active, finishNavigation]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const value = useMemo(
    () => ({
      startNavigation,
    }),
    [startNavigation]
  );

  return (
    <NavigationFeedbackContext.Provider value={value}>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px] origin-left transition-opacity duration-200",
          active ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-[#1a73e8] via-[#4d90fe] to-[#8ab4f8] shadow-[0_0_14px_rgba(26,115,232,0.45)] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {children}
    </NavigationFeedbackContext.Provider>
  );
};

export const useDashboardNavigationFeedback = () => {
  const context = useContext(NavigationFeedbackContext);

  if (!context) {
    return {
      startNavigation: () => undefined,
    };
  }

  return context;
};
