import {
  getBillingAccessMessage,
  getBillingAccessState,
  getCurrentBillingPeriodBounds,
  getReachedUsageMetrics,
  getSubscriptionDisplayStatus,
  getUsageDisplayItems,
  type BillingUsageSnapshot,
} from "@/lib/billing";
import type { UserSubscription } from "@/types/dashboard";

type Props = {
  subscription: UserSubscription | null | undefined;
  usage: BillingUsageSnapshot;
  compact?: boolean;
};

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return "N/A";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BillingStatus = ({ subscription, usage, compact = false }: Props) => {
  const status = getSubscriptionDisplayStatus(subscription);
  const accessState = getBillingAccessState(subscription, usage);
  const reached = getReachedUsageMetrics(usage, subscription);
  const usageItems = getUsageDisplayItems(subscription, usage);
  const currentPeriod = getCurrentBillingPeriodBounds(subscription);

  const title =
    subscription?.plan === "FREE"
      ? "Free package"
      : status === "ACTIVE"
        ? "Active until"
        : accessState === "quota_exhausted"
          ? "Quota reached"
          : "Expired";

  const detail =
    subscription?.plan === "FREE"
      ? currentPeriod?.periodEnd
        ? `Resets ${formatDate(currentPeriod.periodEnd)}`
        : "Ready to use"
      : status === "ACTIVE"
        ? formatDate(currentPeriod?.periodEnd)
        : reached.length > 0
          ? "Limit reached"
          : "Renew package to continue";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <p className="text-sm font-semibold text-slate-900">{detail}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {getBillingAccessMessage(accessState, reached, subscription)}
      </p>
      {!compact ? (
        <div className="mt-3 space-y-2">
          {usageItems.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{item.label}</span>
                <span className="font-medium text-slate-800">
                  {item.used}/{item.limit}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${Math.min(item.percent * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default BillingStatus;
