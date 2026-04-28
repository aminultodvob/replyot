import type { AutomationDetail } from "@/types/dashboard";

export type LockReason = {
  title: string;
  message: string;
};

export type ChannelStatus = "Connected" | "Needs connection";
export type TriggerStatus = "Connected" | "Needs connection" | "Unavailable";

export type ChannelAvailabilityItem = {
  value: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
  ready: boolean;
  selectable: boolean;
  status: ChannelStatus;
  lockReason?: LockReason;
};

export type TriggerAvailability = {
  type: "COMMENT" | "DM";
  available: boolean;
  status: TriggerStatus;
  reason?: string;
};

export type BuilderChannelAvailability = {
  instagramReady: boolean;
  facebookReady: boolean;
  whatsappReady: boolean;
  hasAnyReadyChannel: boolean;
  selectedChannelReady: boolean;
  selectedChannelLockReason?: LockReason;
  selectedIntegrationDetail: string;
  availableChannels: Array<"INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP">;
  channels: Record<
    "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP",
    ChannelAvailabilityItem
  >;
  triggers: Record<"COMMENT" | "DM", TriggerAvailability>;
};

const isFutureDate = (value: Date | string | null | undefined) => {
  if (!value) return true;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() > Date.now();
};

const getInstagramConnection = (automation: AutomationDetail) => {
  const integration = (automation.User?.integrations ?? []).find(
    (item) => item.name === "INSTAGRAM"
  );

  return Boolean(integration?.token) && isFutureDate(integration?.expiresAt);
};

const getFacebookConnection = (automation: AutomationDetail) => {
  const integration = (automation.User?.integrations ?? []).find(
    (item) => item.name === "FACEBOOK_MESSENGER"
  );

  return (
    Boolean(integration?.token) &&
    Boolean(integration?.facebookPageId) &&
    isFutureDate(integration?.expiresAt)
  );
};

const getWhatsAppConnection = (automation: AutomationDetail) => {
  const integration = (automation.User?.integrations ?? []).find(
    (item) => item.name === "WHATSAPP"
  );

  return (
    Boolean(integration?.token) &&
    Boolean(integration?.whatsappPhoneNumberId) &&
    isFutureDate(integration?.expiresAt)
  );
};

export const getBuilderChannelAvailability = (
  automation: AutomationDetail
): BuilderChannelAvailability => {
  const instagramReady = getInstagramConnection(automation);
  const facebookReady = getFacebookConnection(automation);
  const whatsappReady = getWhatsAppConnection(automation);
  const hasAnyReadyChannel = instagramReady || facebookReady || whatsappReady;

  const channels: BuilderChannelAvailability["channels"] = {
    INSTAGRAM: {
      value: "INSTAGRAM",
      ready: instagramReady,
      selectable: instagramReady,
      status: instagramReady ? "Connected" : "Needs connection",
      lockReason: instagramReady
        ? undefined
        : {
            title: "Instagram not connected",
            message: "Connect Instagram in Integrations to use Instagram triggers.",
          },
    },
    FACEBOOK_MESSENGER: {
      value: "FACEBOOK_MESSENGER",
      ready: facebookReady,
      selectable: facebookReady,
      status: facebookReady ? "Connected" : "Needs connection",
      lockReason: facebookReady
        ? undefined
        : {
            title: "Facebook Page not connected",
            message:
          "Connect Facebook and select a Page in Integrations to use Facebook triggers.",
          },
    },
    WHATSAPP: {
      value: "WHATSAPP",
      ready: whatsappReady,
      selectable: whatsappReady,
      status: whatsappReady ? "Connected" : "Needs connection",
      lockReason: whatsappReady
        ? undefined
        : {
            title: "WhatsApp Business not connected",
            message:
              "Connect WhatsApp Business in Integrations to use WhatsApp message triggers.",
          },
    },
  };

  const selectedChannelReady = channels[automation.channel].ready;
  const selectedChannelLockReason = channels[automation.channel].lockReason;

  const triggers: BuilderChannelAvailability["triggers"] = {
    COMMENT: {
      type: "COMMENT",
      available:
        selectedChannelReady &&
        automation.channel !== "WHATSAPP",
      status:
        automation.channel === "WHATSAPP"
          ? "Unavailable"
          : selectedChannelReady
            ? "Connected"
            : "Needs connection",
      reason:
        automation.channel === "WHATSAPP"
          ? "WhatsApp supports DM trigger only."
          : selectedChannelReady
            ? undefined
            : selectedChannelLockReason?.message ??
              "Connect this channel in Integrations first.",
    },
    DM: {
      type: "DM",
      available:
        selectedChannelReady &&
        (automation.channel === "INSTAGRAM" || automation.channel === "WHATSAPP"),
      status:
        automation.channel === "FACEBOOK_MESSENGER"
          ? "Unavailable"
          : selectedChannelReady
            ? "Connected"
            : "Needs connection",
      reason:
        automation.channel === "FACEBOOK_MESSENGER"
          ? "Facebook supports comment trigger only."
          : selectedChannelReady
            ? undefined
            : (selectedChannelLockReason?.message ??
              (automation.channel === "WHATSAPP"
                ? "Connect WhatsApp Business in Integrations first."
                : "Connect Instagram in Integrations first.")),
    },
  };

  const selectedIntegrationDetail = selectedChannelReady
    ? "Connected"
    : selectedChannelLockReason?.title ?? "Needs connection";

  const availableChannels: BuilderChannelAvailability["availableChannels"] = [];
  if (instagramReady) availableChannels.push("INSTAGRAM");
  if (facebookReady) availableChannels.push("FACEBOOK_MESSENGER");
  if (whatsappReady) availableChannels.push("WHATSAPP");

  return {
    instagramReady,
    facebookReady,
    whatsappReady,
    hasAnyReadyChannel,
    selectedChannelReady,
    selectedChannelLockReason,
    selectedIntegrationDetail,
    availableChannels,
    channels,
    triggers,
  };
};
