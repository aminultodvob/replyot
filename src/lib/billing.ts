type SubscriptionSnapshot = {
  plan: "FREE" | "PRO";
  status: "INACTIVE" | "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELED" | "FAILED";
  billingPeriodEnd: Date | string | null;
  billingPeriodStart: Date | string | null;
  updatedAt: Date | string;
  createdAt?: Date | string | null;
  provider: string | null;
} | null | undefined;

export type BillingAccessState =
  | "unpaid"
  | "free_active"
  | "pro_active"
  | "pro_expired"
  | "quota_exhausted";

export type BillingUsageSnapshot = {
  facebookCommentReplies: number;
  instagramDmReplies: number;
  instagramCommentReplies: number;
  whatsappMessagesSent: number;
} | null | undefined;

export type BillingMetric =
  | "facebookCommentReplies"
  | "instagramDmReplies"
  | "instagramCommentReplies"
  | "whatsappMessagesSent";

type SubscriptionStatus = SubscriptionSnapshot extends
  | null
  | undefined
  ? never
  : NonNullable<SubscriptionSnapshot>["status"];

export type BillingUsageCollection = Array<
  NonNullable<BillingUsageSnapshot> & {
    periodStart?: Date | string | null;
    periodEnd?: Date | string | null;
  }
> | null | undefined;

export type PlanCapabilities = {
  plan: "FREE" | "PRO";
  label: string;
  price: string;
  currency: string;
  cycleLabel: string;
  maxAutomations: number;
  maxConnectedChannels: number;
  supportsBothChannels: boolean;
  totalDeliveryLimit: number | null;
  metricLimits: Record<BillingMetric, number> | null;
};

export type BillingUsageDisplayItem = {
  key: string;
  label: string;
  used: number;
  limit: number;
  remaining: number;
  percent: number;
};

export const BILLING_CYCLE_DAYS = Number(
  process.env.NEXT_PUBLIC_UDDOKTAPAY_BILLING_CYCLE_DAYS ?? "30"
);

export const BILLING_PACKAGE_AMOUNT =
  process.env.NEXT_PUBLIC_UDDOKTAPAY_PRO_AMOUNT ?? "500";
export const BILLING_PACKAGE_CURRENCY =
  process.env.NEXT_PUBLIC_UDDOKTAPAY_PRO_CURRENCY ?? "BDT";

export const FREE_PACKAGE_AMOUNT =
  process.env.NEXT_PUBLIC_FREE_PACKAGE_AMOUNT ?? "0";
export const FREE_PACKAGE_CURRENCY =
  process.env.NEXT_PUBLIC_FREE_PACKAGE_CURRENCY ?? "BDT";
export const FREE_AUTOMATION_LIMIT = Number(
  process.env.NEXT_PUBLIC_FREE_AUTOMATION_LIMIT ?? "1"
);
export const FREE_TOTAL_DELIVERY_LIMIT = Number(
  process.env.NEXT_PUBLIC_FREE_TOTAL_DELIVERY_LIMIT ?? "200"
);
export const FREE_MAX_CONNECTED_CHANNELS = Number(
  process.env.NEXT_PUBLIC_FREE_MAX_CONNECTED_CHANNELS ?? "1"
);

export const FACEBOOK_COMMENT_LIMIT = Number(
  process.env.NEXT_PUBLIC_BILLING_FACEBOOK_COMMENT_LIMIT ?? "10000"
);
export const INSTAGRAM_DM_LIMIT = Number(
  process.env.NEXT_PUBLIC_BILLING_INSTAGRAM_DM_LIMIT ?? "1000"
);
export const INSTAGRAM_COMMENT_LIMIT = Number(
  process.env.NEXT_PUBLIC_BILLING_INSTAGRAM_COMMENT_LIMIT ?? "10000"
);
export const BILLING_WARNING_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_BILLING_WARNING_THRESHOLD ?? "0.8"
);
export const WHATSAPP_MESSAGE_LIMIT = Number(
  process.env.NEXT_PUBLIC_BILLING_WHATSAPP_MESSAGE_LIMIT ?? "3000"
);

export const BILLING_LIMITS: Record<BillingMetric, number> = {
  facebookCommentReplies: FACEBOOK_COMMENT_LIMIT,
  instagramDmReplies: INSTAGRAM_DM_LIMIT,
  instagramCommentReplies: INSTAGRAM_COMMENT_LIMIT,
  whatsappMessagesSent: WHATSAPP_MESSAGE_LIMIT,
};

export const BILLING_LIMIT_LABELS: Record<BillingMetric, string> = {
  facebookCommentReplies: "Facebook comment replies",
  instagramDmReplies: "Instagram messages",
  instagramCommentReplies: "Instagram comment replies",
  whatsappMessagesSent: "WhatsApp messages",
};

export const formatBillingPrice = () =>
  `${BILLING_PACKAGE_CURRENCY} ${BILLING_PACKAGE_AMOUNT}`;

export const formatFreePrice = () =>
  Number(FREE_PACKAGE_AMOUNT) > 0
    ? `${FREE_PACKAGE_CURRENCY} ${FREE_PACKAGE_AMOUNT}`
    : "Free";

export const getBillingCycleLabel = () =>
  BILLING_CYCLE_DAYS === 30 ? "month" : `${BILLING_CYCLE_DAYS} days`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const getCurrentBillingPeriodBounds = (
  subscription: SubscriptionSnapshot,
  now = new Date()
) => {
  if (!subscription) {
    return null;
  }

  const rawStart =
    toDate(subscription.billingPeriodStart) ??
    toDate(subscription.createdAt) ??
    now;

  if (subscription.plan === "FREE") {
    const cycleMs = BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000;
    const diffMs = Math.max(now.getTime() - rawStart.getTime(), 0);
    const cycleIndex = Math.floor(diffMs / cycleMs);
    const periodStart = new Date(rawStart.getTime() + cycleIndex * cycleMs);
    const periodEnd = new Date(periodStart.getTime() + cycleMs);

    return {
      periodStart,
      periodEnd,
    };
  }

  const rawEnd = toDate(subscription.billingPeriodEnd) ?? addDays(rawStart, BILLING_CYCLE_DAYS);
  return {
    periodStart: rawStart,
    periodEnd: rawEnd,
  };
};

export const getSubscriptionDisplayStatus = (
  subscription: SubscriptionSnapshot,
  now = new Date()
): SubscriptionStatus => {
  if (!subscription) {
    return "INACTIVE" as const;
  }

  if (subscription.plan === "FREE") {
    return "ACTIVE" as const;
  }

  const billingPeriodEnd = getCurrentBillingPeriodBounds(subscription, now)?.periodEnd;

  if (
    subscription.status === "ACTIVE" &&
    billingPeriodEnd &&
    billingPeriodEnd.getTime() <= now.getTime()
  ) {
    return "EXPIRED" as const;
  }

  return subscription.status;
};

export const isSubscriptionActive = (
  subscription: SubscriptionSnapshot,
  now = new Date()
) =>
  subscription?.plan === "PRO" &&
  getSubscriptionDisplayStatus(subscription, now) === "ACTIVE" &&
  !!getCurrentBillingPeriodBounds(subscription, now)?.periodEnd &&
  getCurrentBillingPeriodBounds(subscription, now)!.periodEnd.getTime() > now.getTime();

export const deriveCurrentPlan = (
  subscription: SubscriptionSnapshot,
  now = new Date()
): "FREE" | "PRO" => {
  if (subscription?.plan === "FREE") {
    return "FREE";
  }

  return isSubscriptionActive(subscription, now) ? "PRO" : "FREE";
};

export const getPlanCapabilities = (plan: "FREE" | "PRO"): PlanCapabilities => {
  if (plan === "FREE") {
    return {
      plan,
      label: "Free",
      price: formatFreePrice(),
      currency: FREE_PACKAGE_CURRENCY,
      cycleLabel: getBillingCycleLabel(),
      maxAutomations: FREE_AUTOMATION_LIMIT,
      maxConnectedChannels: FREE_MAX_CONNECTED_CHANNELS,
      supportsBothChannels: false,
      totalDeliveryLimit: FREE_TOTAL_DELIVERY_LIMIT,
      metricLimits: null,
    };
  }

  return {
    plan,
    label: "Pro",
    price: formatBillingPrice(),
    currency: BILLING_PACKAGE_CURRENCY,
    cycleLabel: getBillingCycleLabel(),
    maxAutomations: Number.MAX_SAFE_INTEGER,
    maxConnectedChannels: 2,
    supportsBothChannels: true,
    totalDeliveryLimit: null,
    metricLimits: BILLING_LIMITS,
  };
};

export const getFreeUsageTotal = (usage: BillingUsageSnapshot) =>
  (usage?.facebookCommentReplies ?? 0) +
  (usage?.instagramDmReplies ?? 0) +
  (usage?.instagramCommentReplies ?? 0) +
  (usage?.whatsappMessagesSent ?? 0);

export const getUsagePercentage = (
  metric: BillingMetric,
  usage: BillingUsageSnapshot
) => {
  const limit = BILLING_LIMITS[metric];
  const used = usage?.[metric] ?? 0;
  if (limit <= 0) {
    return 0;
  }

  return used / limit;
};

export const getFreeUsagePercentage = (usage: BillingUsageSnapshot) => {
  if (FREE_TOTAL_DELIVERY_LIMIT <= 0) {
    return 0;
  }

  return getFreeUsageTotal(usage) / FREE_TOTAL_DELIVERY_LIMIT;
};

export const isMetricLimitReached = (
  metric: BillingMetric,
  usage: BillingUsageSnapshot
) => {
  const limit = BILLING_LIMITS[metric];
  return (usage?.[metric] ?? 0) >= limit;
};

export const isFreeLimitReached = (usage: BillingUsageSnapshot) =>
  getFreeUsageTotal(usage) >= FREE_TOTAL_DELIVERY_LIMIT;

export const getReachedUsageMetrics = (
  usage: BillingUsageSnapshot,
  subscription?: SubscriptionSnapshot
) => {
  if (subscription?.plan === "FREE") {
    return isFreeLimitReached(usage) ? (["instagramDmReplies"] as BillingMetric[]) : [];
  }

  return (Object.keys(BILLING_LIMITS) as BillingMetric[]).filter((metric) =>
    isMetricLimitReached(metric, usage)
  );
};

export const getCurrentPackageState = (
  subscription: SubscriptionSnapshot,
  usage?: BillingUsageSnapshot,
  now = new Date()
): BillingAccessState => {
  if (!subscription) {
    return "unpaid";
  }

  if (subscription.plan === "FREE") {
    return isFreeLimitReached(usage) ? "quota_exhausted" : "free_active";
  }

  const status = getSubscriptionDisplayStatus(subscription, now);

  if (status === "INACTIVE" || status === "PENDING") {
    return "unpaid";
  }

  if (status === "EXPIRED" || status === "CANCELED" || status === "FAILED") {
    return "pro_expired";
  }

  if (status === "ACTIVE" && getReachedUsageMetrics(usage, subscription).length > 0) {
    return "quota_exhausted";
  }

  return "pro_active";
};

export const getBillingAccessState = getCurrentPackageState;

export const getBillingAccessMessage = (
  state: BillingAccessState,
  metrics: BillingMetric[] = [],
  subscription?: SubscriptionSnapshot
) => {
  if (state === "unpaid") {
    return "Choose a package to continue.";
  }

  if (state === "free_active") {
    return `You are on Free with one channel, one automation, and ${FREE_TOTAL_DELIVERY_LIMIT} total deliveries each ${getBillingCycleLabel()}.`;
  }

  if (state === "pro_active") {
    return "Pro access is active.";
  }

  if (state === "pro_expired") {
    return "Your Pro package ended. Renew to unlock both channels, higher limits, and live delivery again.";
  }

  if (subscription?.plan === "FREE") {
    return `You reached the Free limit of ${FREE_TOTAL_DELIVERY_LIMIT} total deliveries for this ${getBillingCycleLabel()}. Upgrade to Pro or wait for the next cycle reset.`;
  }

  const labels = metrics.map((metric) => BILLING_LIMIT_LABELS[metric]).join(", ");
  return labels
    ? `You reached this cycle's limit for ${labels}. Renew next month or wait for the current billing cycle to reset.`
    : "You reached one or more usage limits.";
};

export const getUsageWarningMetrics = (
  usage: BillingUsageSnapshot,
  subscription?: SubscriptionSnapshot
) => {
  if (subscription?.plan === "FREE") {
    return !isFreeLimitReached(usage) &&
      getFreeUsagePercentage(usage) >= BILLING_WARNING_THRESHOLD
      ? (["instagramDmReplies"] as BillingMetric[])
      : [];
  }

  return (Object.keys(BILLING_LIMITS) as BillingMetric[]).filter(
    (metric) =>
      !isMetricLimitReached(metric, usage) &&
      getUsagePercentage(metric, usage) >= BILLING_WARNING_THRESHOLD
  );
};

export const getCurrentBillingUsageFromCollection = (
  usageItems: BillingUsageCollection,
  subscription: SubscriptionSnapshot
) => {
  const bounds = getCurrentBillingPeriodBounds(subscription);

  if (!usageItems?.length || !bounds) {
    return null;
  }

  return (
    usageItems.find(
      (usage) =>
        toDate(usage.periodStart)?.getTime() === bounds.periodStart.getTime() &&
        toDate(usage.periodEnd)?.getTime() === bounds.periodEnd.getTime()
    ) ?? null
  );
};

export const getUsageDisplayItems = (
  subscription: SubscriptionSnapshot,
  usage: BillingUsageSnapshot
): BillingUsageDisplayItem[] => {
  if (subscription?.plan === "FREE") {
    const used = getFreeUsageTotal(usage);
    const limit = FREE_TOTAL_DELIVERY_LIMIT;
    return [
      {
        key: "freeTotal",
        label: "Total free deliveries",
        used,
        limit,
        remaining: Math.max(limit - used, 0),
        percent: limit > 0 ? used / limit : 0,
      },
    ];
  }

  return (Object.keys(BILLING_LIMITS) as BillingMetric[]).map((metric) => {
    const limit = BILLING_LIMITS[metric];
    const used = usage?.[metric] ?? 0;
    return {
      key: metric,
      label: BILLING_LIMIT_LABELS[metric],
      used,
      limit,
      remaining: Math.max(limit - used, 0),
      percent: limit > 0 ? used / limit : 0,
    };
  });
};
