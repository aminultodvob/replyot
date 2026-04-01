"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronUp, CircleCheck, CircleDashed, Sparkles } from "lucide-react";
import DashboardLink from "../dashboard/link";
import type { OnboardingStage } from "@/lib/ux-flow";
import { getNextBestAction } from "@/lib/ux-flow";
import { cn } from "@/lib/utils";
import { trackUxEvent } from "@/lib/ux-analytics";
import React from "react";

type Props = {
  stage: OnboardingStage;
};

const stageItems: Record<
  OnboardingStage,
  Array<{ label: string; complete: boolean }>
> = {
  unpaid: [
    { label: "Choose a package", complete: false },
    { label: "Connect channel", complete: false },
    { label: "Launch first automation", complete: false },
  ],
  pro_expired: [
    { label: "Renew package", complete: false },
    { label: "Reconnect channel if needed", complete: false },
    { label: "Resume live automations", complete: false },
  ],
  quota_exhausted: [
    { label: "Review package limit", complete: false },
    { label: "Wait for cycle reset", complete: false },
    { label: "Upgrade or resume delivery", complete: false },
  ],
  connect_integration: [
    { label: "Package ready", complete: true },
    { label: "Connect channel", complete: false },
    { label: "Create first automation", complete: false },
  ],
  create_automation: [
    { label: "Package ready", complete: true },
    { label: "Channel connected", complete: true },
    { label: "Create first automation", complete: false },
  ],
  complete_setup: [
    { label: "Package ready", complete: true },
    { label: "Channel connected", complete: true },
    { label: "Complete and go live", complete: false },
  ],
  live_automation: [
    { label: "Package ready", complete: true },
    { label: "Channel connected", complete: true },
    { label: "Automation live", complete: true },
  ],
};

const ActivationChecklistWidget = ({ stage }: Props) => {
  const [open, setOpen] = React.useState(true);
  const nextAction = getNextBestAction(stage);
  const items = stageItems[stage];
  const completed = items.filter((item) => item.complete).length;
  const isFullyComplete = completed === items.length;

  React.useEffect(() => {
    const key = `onboarding-stage:${stage}`;
    if (sessionStorage.getItem(key)) {
      return;
    }
    sessionStorage.setItem(key, "1");
    trackUxEvent("onboarding_step_completed", {
      stage,
      completed_steps: completed,
    });
  }, [completed, stage]);

  if (stage === "live_automation" || isFullyComplete) {
    return null;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="fixed bottom-4 right-4 z-40 w-[min(92vw,380px)] rounded-[22px] border border-slate-200 bg-white/95 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Activation checklist
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {completed}/{items.length} completed
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ChevronUp className={cn("size-4 transition", !open && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="border-t border-slate-200 px-4 pb-4 pt-3">
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              {item.complete ? (
                <CircleCheck className="size-4 text-emerald-600" />
              ) : (
                <CircleDashed className="size-4 text-slate-400" />
              )}
              <span className={item.complete ? "text-slate-600" : "text-slate-900"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{nextAction.description}</p>
        <Button
          asChild
          className="mt-3 h-10 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-900"
        >
          <DashboardLink href={nextAction.href}>
            <Sparkles className="size-4" />
            {nextAction.label}
          </DashboardLink>
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ActivationChecklistWidget;
