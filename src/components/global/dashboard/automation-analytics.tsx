"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useQueryAutomationAnalytics } from "@/hooks/user-queries";
import { AutomationAnalyticsResponse } from "@/types/dashboard";
import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
} from "recharts";

type Props = {
  initialData: AutomationAnalyticsResponse;
};

const chartConfig = {
  successfulDeliveries: {
    label: "Successful deliveries",
    color: "hsl(var(--chart-1))",
  },
  commentsReceived: {
    label: "Comments received",
    color: "hsl(var(--chart-2))",
  },
};

const AutomationAnalytics = ({ initialData }: Props) => {
  const [range, setRange] = React.useState<"7d" | "30d">(
    initialData.data?.range === "30d" ? "30d" : "7d"
  );
  const { data } = useQueryAutomationAnalytics(range, initialData);

  if (!data?.data) {
    return (
      <div className="app-panel rounded-[28px] p-6">
        <p className="text-sm text-slate-500">
          Analytics will appear as your automations start receiving events.
        </p>
      </div>
    );
  }

  const analytics = data.data;

  return (
    <div className="app-panel rounded-[28px] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Analytics
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Engagement and delivery performance
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
          <Button
            size="sm"
            variant={range === "7d" ? "default" : "ghost"}
            className={
              range === "7d"
                ? "rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                : "rounded-lg text-slate-600"
            }
            onClick={() => setRange("7d")}
          >
            7 days
          </Button>
          <Button
            size="sm"
            variant={range === "30d" ? "default" : "ghost"}
            className={
              range === "30d"
                ? "rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                : "rounded-lg text-slate-600"
            }
            onClick={() => setRange("30d")}
          >
            30 days
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Comments received",
            value: analytics.totals.commentsReceived,
          },
          {
            label: "Replies sent",
            value: analytics.totals.repliesSent,
          },
          {
            label: "Messages sent",
            value: analytics.totals.messagesSent,
          },
          {
            label: "Unique users",
            value: analytics.totals.uniqueUsers,
          },
          {
            label: "Successful deliveries",
            value: analytics.totals.successfulDeliveries,
          },
        ].map((metric) => (
          <div key={metric.label} className="app-panel-muted rounded-[20px] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[24px] border-slate-200 bg-white shadow-none">
          <CardContent className="p-4">
            <ResponsiveContainer height={280} width="100%">
              <ChartContainer config={chartConfig}>
                <AreaChart data={analytics.trends}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="commentsReceived"
                    type="monotone"
                    fill="var(--color-commentsReceived)"
                    fillOpacity={0.2}
                    stroke="var(--color-commentsReceived)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="successfulDeliveries"
                    type="monotone"
                    fill="var(--color-successfulDeliveries)"
                    fillOpacity={0.3}
                    stroke="var(--color-successfulDeliveries)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="app-panel-muted rounded-[20px] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Channel split
            </p>
            <div className="mt-3 space-y-3">
              {analytics.channelSplit.map((item) => (
                <div key={item.channel} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    {item.channel === "FACEBOOK_MESSENGER"
                      ? "Facebook"
                      : item.channel === "WHATSAPP"
                        ? "WhatsApp"
                      : "Instagram"}
                  </p>
                  <p className="text-sm font-semibold text-slate-950">
                    {item.deliveries}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="app-panel-muted rounded-[20px] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Top automations
            </p>
            <div className="mt-3 space-y-3">
              {analytics.topAutomations.length > 0 ? (
                analytics.topAutomations.map((item) => (
                  <div
                    key={item.automationId}
                    className="flex items-center justify-between gap-3"
                  >
                    <p className="truncate text-sm text-slate-700">{item.name}</p>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.deliveries}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No deliveries yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationAnalytics;
