"use client";

import {
  createAutomations,
  saveTrigger,
  updateAutomationChannel,
  updateAutomationName,
} from "@/actions/automations";
import { MessageCircle, MessageSquare, Radio } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { v4 } from "uuid";
import DashboardLink from "../dashboard/link";
import { getToastConfig, normalizeAppError } from "@/lib/feedback";

type Props = {
  availableIntegrations: {
    INSTAGRAM: boolean;
    FACEBOOK_MESSENGER: boolean;
    WHATSAPP: boolean;
  };
  canCreate?: boolean;
  blockedReason?: string;
};

type Template = {
  id: "IG_COMMENTS_DM" | "IG_DM" | "FB_COMMENT_REPLY" | "WA_DM";
  title: string;
  description: string;
  icon: React.ReactNode;
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
  trigger: "COMMENT" | "DM";
  name: string;
};

const templates: Template[] = [
  {
    id: "IG_COMMENTS_DM",
    title: "DM from Comments",
    description: "Automatically message users who comment on selected Instagram posts.",
    icon: <MessageCircle className="size-5" />,
    channel: "INSTAGRAM",
    trigger: "COMMENT",
    name: "DM from Comments",
  },
  {
    id: "IG_DM",
    title: "Respond to all DMs",
    description: "Auto-respond to incoming Instagram direct messages.",
    icon: <MessageSquare className="size-5" />,
    channel: "INSTAGRAM",
    trigger: "DM",
    name: "Respond to DMs",
  },
  {
    id: "FB_COMMENT_REPLY",
    title: "Facebook Comment Reply",
    description: "Reply publicly when users comment on selected Facebook posts.",
    icon: <Radio className="size-5" />,
    channel: "FACEBOOK_MESSENGER",
    trigger: "COMMENT",
    name: "Facebook Comment Reply",
  },
  {
    id: "WA_DM",
    title: "Respond to WhatsApp chats",
    description: "Auto-respond to incoming WhatsApp Business messages.",
    icon: <MessageCircle className="size-5" />,
    channel: "WHATSAPP",
    trigger: "DM",
    name: "Respond to WhatsApp",
  },
];

const AutomationTemplates = ({
  availableIntegrations,
  canCreate = true,
  blockedReason,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingTemplate, setPendingTemplate] = React.useState<Template["id"] | null>(
    null
  );

  const handleCreate = async (template: Template) => {
    const automationId = v4();
    const destination = `/dashboard/automations/${automationId}?onboarding_notice=automation-created`;
    setPendingTemplate(template.id);
    try {
      const created = await createAutomations(automationId);
      if (created?.status !== 200) {
        const toastConfig = getToastConfig("automation_create", "error", {
          description: normalizeAppError(created?.data, "automation_create"),
        });
        toast(toastConfig.title, {
          description: toastConfig.description,
        });
        return;
      }

      const [nameResult, channelResult, triggerResult] = await Promise.all([
        updateAutomationName(automationId, { name: template.name }),
        updateAutomationChannel(automationId, template.channel),
        saveTrigger(automationId, [template.trigger]),
      ]);

      const failedStep = [nameResult, channelResult, triggerResult].find(
        (result) => result?.status !== 200
      );

      if (failedStep) {
        const toastConfig = getToastConfig("automation_create", "error", {
          description: normalizeAppError(failedStep.data, "automation_create"),
        });
        toast(toastConfig.title, {
          description: toastConfig.description,
        });
        return;
      }

      const toastConfig = getToastConfig("automation_create", "success", {
        description: `${template.title} template is ready.`,
      });
      toast(toastConfig.title, {
        description: toastConfig.description,
      });

      router.prefetch(destination);
      router.replace(destination);
      router.refresh();

      window.setTimeout(() => {
        if (window.location.pathname === pathname) {
          window.location.assign(destination);
        }
      }, 250);
    } catch (error) {
      const toastConfig = getToastConfig("automation_create", "error", {
        description: normalizeAppError(error, "automation_create"),
      });
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
    } finally {
      setPendingTemplate(null);
    }
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Start from a template
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose a workflow, then customize posts, keywords, and response.
          </p>
        </div>
        <DashboardLink
          href="/dashboard/integrations"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950 sm:w-auto"
        >
          Manage integrations
        </DashboardLink>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const integrationReady = availableIntegrations[template.channel];

          return (
          <button
            key={template.id}
            type="button"
            onClick={() => handleCreate(template)}
            disabled={pendingTemplate !== null || !integrationReady || !canCreate}
            className="group rounded-[18px] border border-slate-200 bg-white p-4 text-left transition duration-200 hover:border-[#d2e3fc] hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d2e3fc] bg-[#eef3fd] text-[#1a73e8]">
              {template.icon}
            </span>
            <div className="mt-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                {template.title}
              </h3>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] ${
                  integrationReady
                    ? "bg-[#e6f4ea] text-[#137333]"
                    : "bg-[#fef7e0] text-[#b06000]"
                }`}
              >
                {!canCreate
                  ? "Upgrade"
                  : integrationReady
                    ? "Ready"
                    : "Connect first"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
            <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                {template.channel === "FACEBOOK_MESSENGER"
                  ? "Facebook Page"
                  : template.channel === "WHATSAPP"
                    ? "WhatsApp Business"
                    : "Instagram"}
              </span>
              <span className="inline-flex rounded-lg bg-[#1a73e8] px-3 py-1.5 text-xs font-medium text-white">
                {pendingTemplate === template.id ? "Creating..." : "Use template"}
              </span>
            </div>
            {!canCreate ? (
              <p className="mt-3 text-xs leading-5 text-[#b06000]">{blockedReason}</p>
            ) : !integrationReady ? (
              <p className="mt-3 text-xs leading-5 text-[#b06000]">
                Connect {template.channel === "FACEBOOK_MESSENGER"
                  ? "Facebook Page"
                  : template.channel === "WHATSAPP"
                    ? "WhatsApp Business"
                    : "Instagram"} in Integrations before using this template.
              </p>
            ) : null}
          </button>
          );
        })}
      </div>
    </div>
  );
};

export default AutomationTemplates;
