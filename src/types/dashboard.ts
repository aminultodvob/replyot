import type { SubscriptionPlan } from "@/db";
import type {
  findAutomationForDashboard,
  getAutomations,
} from "@/actions/automations/queries";
import type { findUser } from "@/actions/user/queries";
import type { listPaymentHistoryForUser } from "@/actions/user/queries";
import type { getAutomationAnalyticsForUser } from "@/actions/webhook/queries";
import type { BillingAccessState } from "@/lib/billing";

export type UserProfile = NonNullable<Awaited<ReturnType<typeof findUser>>>;
export type UserSubscription = UserProfile["subscription"];
export type UserBillingUsage = UserProfile["billingUsage"][number] | null;
export type PaymentHistoryItem = Awaited<
  ReturnType<typeof listPaymentHistoryForUser>
>[number];

export type UserPlan = SubscriptionPlan | null;
export type UserAccessState = BillingAccessState;

type AutomationsResult = Awaited<ReturnType<typeof getAutomations>>;

export type AutomationListItem = NonNullable<AutomationsResult>["automations"][number];

export type AutomationDetail = NonNullable<
  Awaited<ReturnType<typeof findAutomationForDashboard>>
>;

export type AutomationListResponse = {
  status: number;
  data: AutomationListItem[];
};

export type AutomationDetailResponse = {
  status: number;
  data?: AutomationDetail;
};

export type AutomationAnalytics = NonNullable<
  Awaited<ReturnType<typeof getAutomationAnalyticsForUser>>
>;

export type AutomationAnalyticsResponse = {
  status: number;
  data: AutomationAnalytics | null;
};
