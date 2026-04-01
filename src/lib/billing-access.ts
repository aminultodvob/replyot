import type { BillingMetric } from "@/db";
import {
  getBillingAccessMessage,
  getBillingAccessState,
  getFreeUsageTotal,
  getReachedUsageMetrics,
  type BillingUsageSnapshot,
} from "./billing";

type SubscriptionLike = {
  plan: "PRO" | "FREE";
  status: "INACTIVE" | "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELED" | "FAILED";
  billingPeriodEnd: Date | null;
  billingPeriodStart: Date | null;
  updatedAt: Date;
  createdAt?: Date | null;
  provider: string | null;
} | null | undefined;

export const ensurePackageMutationAccess = (
  subscription: SubscriptionLike,
  usage?: BillingUsageSnapshot
) => {
  const state = getBillingAccessState(subscription, usage);

  if (
    state === "free_active" ||
    state === "pro_active" ||
    state === "quota_exhausted"
  ) {
    return {
      ok: true as const,
      state,
    };
  }

  return {
    ok: false as const,
    state,
    message: getBillingAccessMessage(state, [], subscription),
  };
};

export const ensurePackageRuntimeAccess = (
  subscription: SubscriptionLike,
  usage: BillingUsageSnapshot,
  metric: BillingMetric
) => {
  const state = getBillingAccessState(subscription, usage);
  const reachedMetrics = getReachedUsageMetrics(usage, subscription);

  if (subscription?.plan === "FREE") {
    if (state === "free_active") {
      return {
        ok: true as const,
        state,
        reachedMetrics,
      };
    }

    return {
      ok: false as const,
      state,
      reachedMetrics,
      message: getBillingAccessMessage(state, reachedMetrics, subscription),
      totalUsage: getFreeUsageTotal(usage),
    };
  }

  if (state === "pro_active" && !reachedMetrics.includes(metric)) {
    return {
      ok: true as const,
      state,
      reachedMetrics,
    };
  }

  if (state === "quota_exhausted" && !reachedMetrics.includes(metric)) {
    return {
      ok: true as const,
      state: "pro_active" as const,
      reachedMetrics,
    };
  }

  return {
    ok: false as const,
    state,
    reachedMetrics,
    message: getBillingAccessMessage(state, reachedMetrics, subscription),
  };
};
