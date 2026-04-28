"use client";

import { Button } from "@/components/ui/button";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { useDeleteAutomation } from "@/hooks/use-automations";
import { useQueryAutomations } from "@/hooks/user-queries";
import { usePaths } from "@/hooks/user-nav";
import { AutomationListResponse } from "@/types/dashboard";
import { cn, getMonth } from "@/lib/utils";
import React, { useMemo } from "react";
import CreateAutomation from "../create-automation";
import DashboardLink from "../dashboard/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Props = {
  initialData: AutomationListResponse;
  availableIntegrations?: {
    INSTAGRAM: boolean;
    FACEBOOK_MESSENGER: boolean;
    WHATSAPP: boolean;
  };
  readOnly?: boolean;
  canCreate?: boolean;
  blockedReason?: string;
};

const AutomationList = ({
  initialData,
  availableIntegrations = {
    INSTAGRAM: true,
    FACEBOOK_MESSENGER: true,
    WHATSAPP: true,
  },
  readOnly = false,
  canCreate = true,
  blockedReason,
}: Props) => {
  const { data } = useQueryAutomations(initialData);
  const { latestVariable } = useMutationDataState(["create-automation"]);
  const { pathname } = usePaths();
  const router = useRouter();
  const [automationToDelete, setAutomationToDelete] = React.useState<string | null>(
    null
  );
  const [confirmText, setConfirmText] = React.useState("");
  const { mutate: deleteAutomationMutation, isPending: deletePending } =
    useDeleteAutomation(() => {
      setAutomationToDelete(null);
      setConfirmText("");
      toast("Deleted", {
        description: "Automation permanently deleted.",
      });
    });

  const optimisticUiData = useMemo(() => {
    if (latestVariable && latestVariable?.variables && data) {
      return { data: [latestVariable.variables, ...data.data] };
    }

    return data || { data: [] };
  }, [latestVariable, data]);

  if (!data) {
    return (
      <div className="flex flex-col gap-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="app-panel h-32 animate-pulse rounded-[28px]" />
        ))}
      </div>
    );
  }

  if (data.status !== 200 || data.data.length <= 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-y-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 text-center sm:px-6">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
          No automations yet
        </h3>
        <p className="max-w-md text-sm text-slate-600">
          Start with one workflow.
        </p>
        {!readOnly ? (
          <CreateAutomation disabled={!canCreate} disabledReason={blockedReason} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
        {optimisticUiData.data!.map((automation) => {
        const createdAt = new Date(automation.createdAt);
        const isCreating =
          latestVariable?.status === "pending" &&
          latestVariable?.variables?.id === automation.id;
        const integrationReady =
          availableIntegrations[
            automation.channel as "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP"
          ] ?? false;
        const automationStatus = !integrationReady
          ? "Integration missing"
          : automation.active
            ? "Live"
            : "Draft";

        return (
          <DashboardLink
            href={`${pathname}/${automation.id}`}
            key={automation.id}
            className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-[#d2e3fc] hover:bg-[#f8fbff] lg:flex lg:items-start lg:gap-5"
          >
            <div
              className="absolute right-4 top-4 z-10"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 rounded-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-slate-200 bg-white">
                  <DropdownMenuItem
                    className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                    onSelect={() => {
                      if (readOnly) return;
                      setAutomationToDelete(automation.id);
                      setConfirmText("");
                    }}
                    disabled={readOnly}
                  >
                    <Trash2 size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative flex flex-1 flex-col items-start">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950 md:text-xl">
                  {automation.name}
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  {automation.channel === "FACEBOOK_MESSENGER"
                    ? "Facebook Page"
                    : automation.channel === "WHATSAPP"
                      ? "WhatsApp Business"
                    : "Instagram"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    !integrationReady
                      ? "bg-amber-50 text-amber-700"
                      : automation.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {automationStatus}
                </span>
                {isCreating ? (
                  <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Creating...
                  </span>
                ) : null}
              </div>
              <p className="mb-2 mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {automation.channel === "FACEBOOK_MESSENGER"
                  ? "Public Facebook comment reply automation for your connected Page."
                  : automation.channel === "WHATSAPP"
                    ? "WhatsApp Business automation for inbound message replies."
                  : "Instagram automation for comments or direct messages"}
              </p>
              {!integrationReady ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p>
                    This automation cannot go live until the required integration is connected.
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      router.push("/dashboard/integrations");
                    }}
                    className="mt-2 inline-flex rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
                  >
                    Continue Setup
                  </button>
                </div>
              ) : readOnly ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Billing is inactive, so this automation is visible but locked for edits.
                </p>
              ) : null}

              {automation.keywords.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {
                    //@ts-ignore
                    automation.keywords.map((keyword) => (
                      <div
                        key={keyword.id}
                        className={cn(
                          "rounded-full border px-3 py-1 capitalize text-xs font-medium",
                          "bg-emerald-50 border-emerald-200 text-emerald-700"
                        )}
                      >
                        {keyword.word}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="mt-3 rounded-full border border-dashed border-slate-300 px-3 py-1">
                  <p className="text-sm text-slate-500">No keywords</p>
                </div>
              )}
            </div>
            <div className="relative mt-4 flex flex-col gap-3 border-t border-slate-200/80 pt-3 sm:flex-row sm:items-end sm:justify-between lg:mt-0 lg:min-w-[170px] lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0 lg:text-right">
              <p className="capitalize text-sm font-medium text-slate-400">
                {getMonth(createdAt.getUTCMonth() + 1)}{" "}
                {createdAt.getUTCDate() === 1
                  ? `${createdAt.getUTCDate()}st`
                  : `${createdAt.getUTCDate()}th`}{" "}
                {createdAt.getUTCFullYear()}
              </p>

              <Button
                variant="outline"
                className="w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                {!integrationReady
                  ? "Blocked"
                  : automation.channel === "FACEBOOK_MESSENGER"
                    ? "Comment Flow"
                    : automation.channel === "WHATSAPP"
                      ? "WhatsApp Flow"
                    : "Automation"}
              </Button>
            </div>
          </DashboardLink>
        );
      })}

      <AlertDialog
        open={Boolean(automationToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setAutomationToDelete(null);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent className="border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-950">
              Delete automation permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This cannot be undone. Type DELETE to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="Type DELETE"
            className="border-slate-300 text-slate-900"
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-300 text-slate-700"
              disabled={deletePending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePending || confirmText !== "DELETE" || !automationToDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={(event) => {
                event.preventDefault();
                if (!automationToDelete) return;
                deleteAutomationMutation({ automationId: automationToDelete });
              }}
            >
              {deletePending ? "Deleting..." : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AutomationList;
