import { Comment, PlaneBlue } from "@/icons";
import { MessageCircleMore } from "lucide-react";
import { v4 } from "uuid";

export type AutomationListenerProps = {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
  type: "MESSAGE";
};

export type AutomationsTriggerProps = {
  id: string;
  label: string;
  icon: JSX.Element;
  description: string;
  type: "COMMENT" | "DM";
};

export type AutomationChannelOption = {
  id: string;
  label: string;
  description: string;
  value: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
};

export const AUTOMATION_CHANNELS: AutomationChannelOption[] = [
  {
    id: v4(),
    label: "Instagram",
    description: "Use Instagram DMs and comment automations.",
    value: "INSTAGRAM",
  },
  {
    id: v4(),
    label: "Facebook Page",
    description: "Use Facebook Page comment automations.",
    value: "FACEBOOK_MESSENGER",
  },
  {
    id: v4(),
    label: "WhatsApp Business",
    description: "Use WhatsApp message automations.",
    value: "WHATSAPP",
  },
];

export const AUTOMATION_TRIGGERS: AutomationsTriggerProps[] = [
  {
    id: v4(),
    label: "Comment on selected posts",
    icon: <Comment />,
    description: "Trigger when a comment on an attached post matches a keyword.",
    type: "COMMENT",
  },
  {
    id: v4(),
    label: "Incoming DM",
    icon: <MessageCircleMore className="size-4" />,
    description: "Trigger when an incoming DM matches a keyword (Instagram or WhatsApp).",
    type: "DM",
  },
];

export const AUTOMATION_LISTENERS: AutomationListenerProps[] = [
  {
    id: v4(),
    label: "Send the user a message",
    icon: <PlaneBlue />,
    description: "Enter the message that you want to send the user.",
    type: "MESSAGE",
  },
];
