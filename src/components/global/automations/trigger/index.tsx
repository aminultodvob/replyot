"use client";

import React from "react";
import { AUTOMATION_CHANNELS, AUTOMATION_TRIGGERS } from "@/constants/automation";
import { useTriggers } from "@/hooks/use-automations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Loader from "../../loader";
import { AutomationDetail } from "@/types/dashboard";
import InlineStatus from "../../inline-status";
import { useMutationDataState } from "@/hooks/use-mutation-data";

type Props = {
  id: string;
  automation: AutomationDetail;
};

const Trigger = ({ id, automation }: Props) => {
  const { types, channel, onSetChannel, onSetTrigger, onSaveTrigger, isPending, channelPending } =
    useTriggers(
      id,
      automation.channel ?? "INSTAGRAM",
      automation.trigger.map((item) => item.type)
    );
  const { latestVariable } = useMutationDataState(["add-trigger"]);

  const effectiveTriggers =
    channel === "FACEBOOK_MESSENGER"
      ? AUTOMATION_TRIGGERS.filter((trigger) => trigger.type === "COMMENT")
      : channel === "WHATSAPP"
        ? AUTOMATION_TRIGGERS.filter((trigger) => trigger.type === "DM")
      : AUTOMATION_TRIGGERS;

  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {AUTOMATION_CHANNELS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSetChannel(option.value)}
            className={cn(
              "rounded-[20px] border px-4 py-4 text-left transition",
              channel === option.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900"
            )}
          >
            <p className="font-semibold">{option.label}</p>
            <p className="mt-1 text-xs">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {effectiveTriggers.map((trigger) => (
          <button
            type="button"
            key={trigger.id}
            onClick={() => onSetTrigger(trigger.type)}
            className={cn(
              "flex flex-col gap-y-2 rounded-[20px] border p-4 text-left transition",
              types.includes(trigger.type)
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            )}
          >
            <span className="flex items-center gap-x-2">
              {trigger.icon}
              <p className="font-semibold">{trigger.label}</p>
            </span>
            <p className="text-sm">{trigger.description}</p>
          </button>
        ))}
      </div>

      <Button
        onClick={onSaveTrigger}
        disabled={types.length === 0}
        className="rounded-xl bg-slate-900 font-medium text-white hover:bg-slate-800"
      >
        <Loader state={isPending}>Save trigger setup</Loader>
      </Button>
      <InlineStatus
        status={
          channelPending || latestVariable?.status === "pending"
            ? "pending"
            : latestVariable?.status === "success"
              ? "success"
              : latestVariable?.status === "error"
                ? "error"
                : "idle"
        }
        pendingLabel="Saving trigger setup..."
        successLabel="Trigger synced"
        errorLabel="Trigger update failed"
      />
    </div>
  );
};

export default Trigger;
