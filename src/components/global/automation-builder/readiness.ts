import type { AutomationDetail } from "@/types/dashboard";
import { getBuilderChannelAvailability } from "./channel-availability";

export type BuilderStepId =
  | "setup"
  | "posts"
  | "keywords"
  | "response"
  | "review";

export type ReadinessChecklistItem = {
  id: string;
  stepId: BuilderStepId;
  label: string;
  complete: boolean;
};

export type BuilderStepMeta = {
  id: BuilderStepId;
  title: string;
  description: string;
  summary: string;
  complete: boolean;
  optional?: boolean;
};

export type AutomationReadiness = {
  steps: BuilderStepMeta[];
  checklist: ReadinessChecklistItem[];
  completionCount: number;
  totalSteps: number;
  progressPercent: number;
  hasCommentTrigger: boolean;
  hasDmTrigger: boolean;
  hasTrigger: boolean;
  hasPosts: boolean;
  hasKeywords: boolean;
  hasListener: boolean;
  hasRequiredIntegration: boolean;
  needsPosts: boolean;
  canGoLive: boolean;
  isBlocked: boolean;
  channelLabel: string;
  triggerLabel: string;
  currentStatus: string;
  lifecycleLabel: "Live" | "Ready" | "Blocked" | "Draft";
  responsePreview: string;
  firstIncompleteStepId: BuilderStepId;
};

const truncate = (value: string, length = 96) => {
  if (!value.trim()) {
    return "";
  }

  if (value.length <= length) {
    return value.trim();
  }

  return `${value.slice(0, length).trim()}...`;
};

export const buildAutomationReadiness = (
  automation: AutomationDetail
): AutomationReadiness => {
  const hasCommentTrigger = automation.trigger.some(
    (trigger) => trigger.type === "COMMENT"
  );
  const hasDmTrigger = automation.trigger.some((trigger) => trigger.type === "DM");
  const hasTrigger = automation.trigger.length > 0;
  const needsPosts = hasCommentTrigger;
  const hasPosts = automation.posts.length > 0;
  const hasKeywords = automation.keywords.length > 0;
  const hasListener = Boolean(
    automation.listener &&
      (automation.channel === "FACEBOOK_MESSENGER"
        ? automation.listener.commentReply?.trim() || automation.listener.prompt?.trim()
        : automation.listener.prompt?.trim())
  );
  const availability = getBuilderChannelAvailability(automation);
  const hasRequiredIntegration = availability.selectedChannelReady;

  const canGoLive =
    hasRequiredIntegration &&
    hasTrigger &&
    hasKeywords &&
    hasListener &&
    (!needsPosts || hasPosts);

  const channelLabel =
    automation.channel === "FACEBOOK_MESSENGER"
      ? "Facebook Page"
      : automation.channel === "WHATSAPP"
        ? "WhatsApp Business"
        : "Instagram";
  const triggerLabels = automation.trigger.map((trigger) =>
    trigger.type === "COMMENT" ? "Comment" : "DM"
  );
  const triggerLabel = triggerLabels.length
    ? triggerLabels.join(" + ")
    : "No trigger";

  const instagramReply = truncate(automation.listener?.prompt ?? "");
  const publicReply = truncate(
    automation.listener?.commentReply ?? automation.listener?.prompt ?? ""
  );
  const responsePreview =
    automation.channel === "FACEBOOK_MESSENGER"
      ? publicReply || "No public reply yet."
      : instagramReply
        ? publicReply
          ? `DM: ${instagramReply} | Comment: ${publicReply}`
          : `DM: ${instagramReply}`
        : "No response yet.";

  const setupSummary = hasTrigger
    ? `${channelLabel} / ${triggerLabel}`
    : hasRequiredIntegration
      ? "Choose channel + trigger"
      : availability.selectedChannelLockReason?.title ?? "Connect channel";
  const postsSummary = !needsPosts
    ? "Optional for DM flow"
    : hasPosts
      ? `${automation.posts.length} selected ${
          automation.posts.length === 1 ? "post" : "posts"
        }`
      : "Choose posts";
  const keywordSummary = hasKeywords
    ? automation.keywords
        .slice(0, 3)
        .map((keyword) => keyword.word)
        .join(", ")
    : "Add keywords";
  const responseSummary = hasListener
    ? responsePreview
    : automation.channel === "FACEBOOK_MESSENGER"
      ? "Add public reply"
      : automation.channel === "WHATSAPP"
        ? "Add WhatsApp reply"
        : "Add DM reply";

  const checklist: ReadinessChecklistItem[] = [
    {
      id: "integration",
      stepId: "setup",
      label: `${channelLabel} connected`,
      complete: hasRequiredIntegration,
    },
    {
      id: "trigger",
      stepId: "setup",
      label: "Trigger chosen",
      complete: hasTrigger,
    },
    {
      id: "posts",
      stepId: "posts",
      label: needsPosts ? "Posts selected" : "Post step skipped",
      complete: !needsPosts || hasPosts,
    },
    {
      id: "keywords",
      stepId: "keywords",
      label: "Keywords added",
      complete: hasKeywords,
    },
    {
      id: "response",
      stepId: "response",
        label:
        automation.channel === "FACEBOOK_MESSENGER"
          ? "Reply saved"
          : automation.channel === "WHATSAPP"
            ? "WhatsApp reply saved"
            : "Response saved",
      complete: hasListener,
    },
  ];

  const steps: BuilderStepMeta[] = [
    {
      id: "setup",
      title: "Channel & trigger",
      description: "Pick the channel and event.",
      summary: setupSummary,
      complete: hasTrigger && hasRequiredIntegration,
    },
    {
      id: "posts",
      title: "Selected posts",
      description: needsPosts ? "Choose posts to watch." : "Skip for DM-only flows.",
      summary: postsSummary,
      complete: !needsPosts || hasPosts,
      optional: !needsPosts,
    },
    {
      id: "keywords",
      title: "Trigger keywords",
      description: "Words that start the flow.",
      summary: keywordSummary,
      complete: hasKeywords,
    },
    {
      id: "response",
      title:
        automation.channel === "FACEBOOK_MESSENGER"
          ? "Public reply"
          : automation.channel === "WHATSAPP"
            ? "WhatsApp reply"
            : "Response",
      description:
        automation.channel === "FACEBOOK_MESSENGER"
          ? "What gets posted publicly."
          : automation.channel === "WHATSAPP"
            ? "What gets sent back on WhatsApp."
            : "What gets sent after the trigger.",
      summary: responseSummary,
      complete: hasListener,
    },
    {
      id: "review",
      title: "Readiness review",
      description: "Check the flow before launch.",
      summary: canGoLive
        ? automation.active
          ? "Automation is live."
          : "Ready to go live."
        : `${checklist.filter((item) => !item.complete).length} left`,
      complete: canGoLive,
    },
  ];

  const completionCount = steps.filter((step) => step.complete).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completionCount / totalSteps) * 100);
  const firstIncompleteStepId =
    steps.find((step) => !step.complete && step.id !== "review")?.id ?? "review";

  const lifecycleLabel = automation.active
    ? "Live"
    : canGoLive
      ? "Ready"
      : !hasRequiredIntegration
        ? "Blocked"
        : "Draft";

  const currentStatus = automation.active
    ? "Live"
    : canGoLive
      ? "Ready to go live"
      : !hasRequiredIntegration
        ? availability.selectedChannelLockReason?.title ?? `Connect ${channelLabel}`
        : "Finish setup";

  return {
    steps,
    checklist,
    completionCount,
    totalSteps,
    progressPercent,
    hasCommentTrigger,
    hasDmTrigger,
    hasTrigger,
    hasPosts,
    hasKeywords,
    hasListener,
    hasRequiredIntegration,
    needsPosts,
    canGoLive,
    isBlocked: !hasRequiredIntegration,
    channelLabel,
    triggerLabel,
    currentStatus,
    lifecycleLabel,
    responsePreview,
    firstIncompleteStepId,
  };
};
