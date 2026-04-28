import {
  BILLING_LIMIT_LABELS,
  BILLING_LIMITS,
  getBillingAccessState,
  getCurrentBillingPeriodBounds,
  getCurrentBillingUsageFromCollection,
  getUsageDisplayItems,
  getReachedUsageMetrics,
  getSubscriptionDisplayStatus,
  type BillingMetric,
  type BillingUsageSnapshot,
} from "@/lib/billing";
import type { AutomationListItem, UserProfile } from "@/types/dashboard";

export type OnboardingStage =
  | "unpaid"
  | "pro_expired"
  | "quota_exhausted"
  | "connect_integration"
  | "create_automation"
  | "complete_setup"
  | "live_automation";

export type NextBestAction = {
  label: string;
  href: string;
  description: string;
};

export type OnboardingBanner = {
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "blue" | "amber" | "emerald";
  steps: Array<{
    label: string;
    complete: boolean;
  }>;
};

const hasReadyIntegration = (profile: UserProfile | null) => {
  if (!profile?.integrations?.length) {
    return false;
  }

  const hasInstagram = profile.integrations.some(
    (integration) => integration.name === "INSTAGRAM" && Boolean(integration.token)
  );
  const hasFacebook = profile.integrations.some(
    (integration) =>
      integration.name === "FACEBOOK_MESSENGER" &&
      Boolean(integration.token) &&
      Boolean(integration.facebookPageId)
  );
  const hasWhatsApp = profile.integrations.some(
    (integration) =>
      integration.name === "WHATSAPP" &&
      Boolean(integration.token) &&
      Boolean(integration.whatsappPhoneNumberId)
  );

  return hasInstagram || hasFacebook || hasWhatsApp;
};

export const getOnboardingStage = (
  profile: UserProfile | null,
  automations: AutomationListItem[]
): OnboardingStage => {
  const usage = getCurrentBillingUsageFromCollection(
    profile?.billingUsage,
    profile?.subscription
  );
  const accessState = getBillingAccessState(profile?.subscription, usage);

  if (accessState === "unpaid") {
    return "unpaid";
  }

  if (accessState === "pro_expired") {
    return "pro_expired";
  }

  if (accessState === "quota_exhausted") {
    return "quota_exhausted";
  }

  if (!hasReadyIntegration(profile)) {
    return "connect_integration";
  }

  if (automations.length === 0) {
    return "create_automation";
  }

  const hasLive = automations.some((automation) => automation.active);
  if (hasLive) {
    return "live_automation";
  }

  return "complete_setup";
};

export const getNextBestAction = (
  stage: OnboardingStage
): NextBestAction => {
  if (stage === "unpaid" || stage === "pro_expired" || stage === "quota_exhausted") {
    return {
      label: "Continue Setup",
      href: "/dashboard/settings",
      description: "Review package access, limits, or upgrade options.",
    };
  }

  if (stage === "connect_integration") {
    return {
      label: "Continue Setup",
      href: "/dashboard/integrations",
      description: "Connect Instagram, Facebook, or WhatsApp first.",
    };
  }

  if (stage === "create_automation") {
    return {
      label: "Start Setup",
      href: "/dashboard/automations",
      description: "Create your first automation workflow.",
    };
  }

  if (stage === "complete_setup") {
    return {
      label: "Continue Setup",
      href: "/dashboard/automations",
      description: "Finish posts, keywords, and reply settings before going live.",
    };
  }

  return {
    label: "Continue Setup",
    href: "/dashboard",
    description: "Monitor performance and quota health.",
  };
};

export const getOnboardingBanner = (
  stage: OnboardingStage
): OnboardingBanner | null => {
  const nextAction = getNextBestAction(stage);

  if (stage === "live_automation") {
    return null;
  }

  if (stage === "unpaid") {
    return {
      badge: "Package",
      title: "Choose a package to begin setup",
      description: "Pick Free to start with one channel and one automation, or upgrade to Pro when you need more.",
      ctaLabel: nextAction.label,
      ctaHref: nextAction.href,
      tone: "amber",
      steps: [
        { label: "Package ready", complete: false },
        { label: "Channel connected", complete: false },
        { label: "Automation live", complete: false },
      ],
    };
  }

  if (stage === "pro_expired") {
    return {
      badge: "Billing",
      title: "Renew Pro to restore full access",
      description: "Your data is still here. Renew when you want both channels, higher limits, and live delivery back.",
      ctaLabel: nextAction.label,
      ctaHref: nextAction.href,
      tone: "amber",
      steps: [
        { label: "Package ready", complete: false },
        { label: "Channel connected", complete: true },
        { label: "Automation live", complete: false },
      ],
    };
  }

  if (stage === "quota_exhausted") {
    return {
      badge: "Limits",
      title: "You reached this cycle's delivery limit",
      description: "Upgrade or wait for the next reset, then continue running your automations without changing the setup.",
      ctaLabel: nextAction.label,
      ctaHref: nextAction.href,
      tone: "amber",
      steps: [
        { label: "Package ready", complete: true },
        { label: "Channel connected", complete: true },
        { label: "Automation live", complete: false },
      ],
    };
  }

  if (stage === "connect_integration") {
    return {
      badge: "Step 1",
      title: "Connect your first channel",
      description: "Start with the channel where your customers already reply, then the rest of the setup becomes available.",
      ctaLabel: nextAction.label,
      ctaHref: nextAction.href,
      tone: "blue",
      steps: [
        { label: "Package ready", complete: true },
        { label: "Channel connected", complete: false },
        { label: "Automation live", complete: false },
      ],
    };
  }

  if (stage === "create_automation") {
    return {
      badge: "Step 2",
      title: "Create your first automation",
      description: "Start with the recommended template, then customize keywords, posts, and the reply before you launch.",
      ctaLabel: nextAction.label,
      ctaHref: nextAction.href,
      tone: "blue",
      steps: [
        { label: "Package ready", complete: true },
        { label: "Channel connected", complete: true },
        { label: "Automation live", complete: false },
      ],
    };
  }

  return {
    badge: "Step 3",
    title: "Finish setup and go live",
    description: "Complete the missing pieces in your draft automation, then activate it when everything reads clearly.",
    ctaLabel: nextAction.label,
    ctaHref: nextAction.href,
    tone: "blue",
    steps: [
      { label: "Package ready", complete: true },
      { label: "Channel connected", complete: true },
      { label: "Automation live", complete: false },
    ],
  };
};

export const getIntegrationFeedbackMessage = (code?: string | null) => {
  const messages = {
    "instagram-already-connected":
      "This Instagram account is already connected to another user. Disconnect it there first or use a different Instagram account.",
    "free-channel-limit":
      "Free supports one connected channel at a time. Disconnect the current channel or upgrade to Pro.",
    "instagram-account-unavailable":
      "Instagram connected, but the account details could not be verified. Please try again.",
    "instagram-connected": "Instagram connected successfully. Next, create your first automation.",
    "facebook-connected": "Facebook Page connected successfully. Next, create or finish your automation.",
    "facebook-session-expired":
      "The Facebook page-selection session expired. Please reconnect Facebook and choose the page again.",
    "facebook-page-already-connected":
      "This Facebook Page is already connected to another user. Disconnect it there first or choose a different Page.",
    "facebook-no-pages":
      "Facebook connected, but no manageable Pages were found for this account.",
    "facebook-auth-invalid":
      "Facebook authorization expired or was rejected. Please connect Facebook again.",
    "facebook-permission-missing":
      "Facebook did not grant the required Page permissions. Please accept all requested permissions and try again.",
    "facebook-rate-limited":
      "Facebook temporarily rate-limited this connection attempt. Please wait a moment and try again.",
    "service-timeout":
      "The app could not reach the database in time. Please try again in a moment.",
    "facebook-connect-failed":
      "Facebook could not be connected right now. Please try again.",
    "whatsapp-connected":
      "WhatsApp Business connected successfully. You can now build message automations.",
    "whatsapp-config-missing":
      "WhatsApp Embedded Signup is missing required app configuration. Add the public app/config IDs and system token first.",
    "whatsapp-number-already-connected":
      "This WhatsApp phone number is already connected to another user. Disconnect it there first or use a different number.",
    "whatsapp-phone-unavailable":
      "WhatsApp connected, but the phone number details could not be verified. Please try again.",
    "whatsapp-auth-invalid":
      "WhatsApp authorization was rejected or expired. Please connect again.",
    "whatsapp-permission-missing":
      "Meta did not grant the required WhatsApp permissions. Accept all requested permissions and try again.",
    "whatsapp-rate-limited":
      "Meta temporarily rate-limited this WhatsApp connection attempt. Please try again shortly.",
    "whatsapp-connect-failed":
      "WhatsApp Business could not be connected right now. Please try again.",
  } as const;

  return code && code in messages
    ? messages[code as keyof typeof messages]
    : null;
};

export type FlowHealthItem = {
  label: string;
  complete: boolean;
  detail: string;
};

export type FlowHealth = {
  statusLabel: "Free package" | "Active until" | "Expired" | "Quota reached" | "Quota warning";
  statusDetail: string;
  quotaItems: Array<{
    metric: BillingMetric | "freeTotal";
    label: string;
    used: number;
    limit: number;
    remaining: number;
  }>;
  checklist: FlowHealthItem[];
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

const getQuotaItems = (
  usage: BillingUsageSnapshot,
  subscription: UserProfile["subscription"] | null | undefined
) =>
  getUsageDisplayItems(subscription, usage).map((item) => ({
    metric: item.key as BillingMetric | "freeTotal",
    label: item.label,
    used: item.used,
    limit: item.limit,
    remaining: item.remaining,
  }));

export const getFlowHealth = (input: {
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
  hasConnectedIntegration: boolean;
  integrationDetail?: string;
  hasTrigger: boolean;
  needsPosts: boolean;
  hasPosts: boolean;
  hasKeywords: boolean;
  hasResponse: boolean;
  subscription: UserProfile["subscription"] | null | undefined;
  usage: BillingUsageSnapshot;
}): FlowHealth => {
  const quotaItems = getQuotaItems(input.usage, input.subscription);
  const reached = getReachedUsageMetrics(input.usage, input.subscription);
  const subscriptionStatus = getSubscriptionDisplayStatus(input.subscription);
  const currentPeriod = getCurrentBillingPeriodBounds(input.subscription);

  let statusLabel: FlowHealth["statusLabel"] = "Quota warning";
  let statusDetail = "Usage is healthy";

  if (input.subscription?.plan === "FREE") {
    statusLabel = reached.length > 0 ? "Quota reached" : "Free package";
    statusDetail = currentPeriod?.periodEnd
      ? `Resets ${formatDate(currentPeriod.periodEnd)}`
      : "One channel, one automation";
  } else if (subscriptionStatus !== "ACTIVE") {
    statusLabel = "Expired";
    statusDetail = `Access ended ${formatDate(currentPeriod?.periodEnd)}`;
  } else if (reached.length > 0) {
    statusLabel = "Quota reached";
    statusDetail = `${reached.length} quota bucket(s) reached`;
  } else {
    statusLabel = "Active until";
    statusDetail = formatDate(currentPeriod?.periodEnd);
  }

  return {
    statusLabel,
    statusDetail,
    quotaItems,
    checklist: [
      {
        label: "Integration",
        complete: input.hasConnectedIntegration,
        detail: input.hasConnectedIntegration
          ? input.integrationDetail || "Connected"
          : input.integrationDetail ||
            (input.channel === "FACEBOOK_MESSENGER"
              ? "Connect Facebook Page"
              : input.channel === "WHATSAPP"
                ? "Connect WhatsApp Business"
              : "Connect Instagram"),
      },
      {
        label: "Trigger",
        complete: input.hasTrigger,
        detail: input.hasTrigger ? "Configured" : "Select trigger",
      },
      {
        label: "Posts",
        complete: !input.needsPosts || input.hasPosts,
        detail: input.needsPosts
          ? input.hasPosts
            ? "Attached"
            : "Select posts"
          : "Optional",
      },
      {
        label: "Keywords",
        complete: input.hasKeywords,
        detail: input.hasKeywords ? "Ready" : "Add at least one",
      },
      {
        label: "Response",
        complete: input.hasResponse,
        detail: input.hasResponse ? "Saved" : "Write reply",
      },
    ],
  };
};
