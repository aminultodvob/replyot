import { getAllAutomations } from "@/actions/automations";
import { BarDuoToneBlue } from "@/icons";
import React from "react";
import Chart from "./metrics";
import MetricsCard from "./metrics/metrics-card";

const ActivitySection = async () => {
  const automationsResult = await getAllAutomations();
  const automations =
    automationsResult.status === 200 ? automationsResult.data : [];
  const comments = automations.reduce(
    (current, next) => current + (next.listener?.commentCount ?? 0),
    0
  );
  const dms = automations.reduce(
    (current, next) => current + (next.listener?.dmCount ?? 0),
    0
  );
  const automatedInteractions = comments + dms;

  return (
    <div className="app-panel relative rounded-[32px] p-6">
      <span className="z-50 flex items-center gap-x-2">
        <BarDuoToneBlue />
        <div className="z-50">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Activity
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Automated Activity
          </h2>
          <p className="text-sm text-slate-500">
            Automated {automatedInteractions} interactions across your account
          </p>
        </div>
      </span>
      <div className="mt-6 flex w-full flex-col gap-5 lg:flex-row">
        <div className="app-panel-muted rounded-[24px] p-4 lg:w-6/12">
          <Chart />
        </div>
        <div className="lg:w-6/12">
          <MetricsCard comments={comments} dms={dms} />
        </div>
      </div>
    </div>
  );
};

export default ActivitySection;
