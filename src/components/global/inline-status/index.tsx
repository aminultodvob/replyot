"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useDelayedPending } from "@/hooks/use-delayed-pending";

type MutationFeedbackStatus = "idle" | "pending" | "success" | "error";

type Props = {
  status: MutationFeedbackStatus;
  pendingLabel: string;
  successLabel?: string;
  errorLabel?: string;
  className?: string;
};

const toneMap: Record<
  Exclude<MutationFeedbackStatus, "idle">,
  { dot: string; text: string }
> = {
  pending: {
    dot: "bg-[#768BDD]",
    text: "text-[#9FB0F2]",
  },
  success: {
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  error: {
    dot: "bg-rose-400",
    text: "text-rose-300",
  },
};

const InlineStatus = ({
  status,
  pendingLabel,
  successLabel = "Saved",
  errorLabel = "Could not save",
  className,
}: Props) => {
  const [visibleStatus, setVisibleStatus] =
    useState<MutationFeedbackStatus>("idle");
  const delayedPending = useDelayedPending(status === "pending");

  useEffect(() => {
    if (status === "idle") {
      setVisibleStatus("idle");
      return;
    }

    if (status === "pending") {
      return;
    }

    setVisibleStatus(status);

    const timer = window.setTimeout(() => setVisibleStatus("idle"), 1600);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === "pending" && delayedPending) {
      setVisibleStatus("pending");
    }
  }, [delayedPending, status]);

  if (visibleStatus === "idle") {
    return null;
  }

  const label =
    visibleStatus === "pending"
      ? pendingLabel
      : visibleStatus === "success"
        ? successLabel
        : errorLabel;

  const tone = toneMap[visibleStatus];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-x-2 text-xs font-medium tracking-wide",
        tone.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
};

export default InlineStatus;
