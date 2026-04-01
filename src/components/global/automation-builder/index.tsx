"use client";

import { activateAutomation } from "@/actions/automations";
import { useDeleteAutomation, useEditAutomation } from "@/hooks/use-automations";
import { useMutationData, useMutationDataState } from "@/hooks/use-mutation-data";
import { useQueryAutomation } from "@/hooks/user-queries";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { AutomationDetailResponse } from "@/types/dashboard";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import DashboardLink from "../dashboard/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  MoreHorizontal,
  Pencil,
  Power,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { buildAutomationReadiness, type BuilderStepId } from "./readiness";
import { getBuilderChannelAvailability } from "./channel-availability";
import {
  getBillingAccessMessage,
  type BillingAccessState,
  type BillingUsageSnapshot,
} from "@/lib/billing";
import { trackUxEvent } from "@/lib/ux-analytics";
import {
  BuilderStepCard,
  ChecklistItem,
  KEYWORD_SUGGESTIONS,
  KeywordsStep,
  PostsStep,
  ResponseStep,
  ReviewStep,
  SetupStep,
} from "./ui";
import BillingStatus from "../billing/billing-status";

type Props = {
  id: string;
  initialData: AutomationDetailResponse;
  accessState?: BillingAccessState;
  usage?: BillingUsageSnapshot;
};

const getLifecycleTone = (label: "Live" | "Ready" | "Blocked" | "Draft") => {
  if (label === "Live") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (label === "Ready") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (label === "Blocked") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
};

const getSyncTone = (status: "idle" | "pending" | "success" | "error") => {
  if (status === "pending") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "success") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "error") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  return "bg-white/80 text-slate-600 border-slate-200";
};

const NEXT_STEP_HELPERS: Record<string, string> = {
  integration: "Connect the channel you want this automation to run on.",
  trigger: "Choose the event that should start this automation.",
  posts: "Attach the posts this automation should listen to.",
  keywords: "Add at least one keyword users will send or comment.",
  response: "Write the reply this automation should send.",
};

const AutomationBuilder = ({
  id,
  initialData,
  accessState = "pro_active",
  usage = null,
}: Props) => {
  const { data } = useQueryAutomation(id, initialData);
  const automation = data?.data;
  const router = useRouter();
  const searchParams = useSearchParams();
  const automationsHref = "/dashboard/automations";
  const integrationsHref = "/dashboard/integrations";

  const [activeStep, setActiveStep] = React.useState<BuilderStepId>("setup");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [successNotice, setSuccessNotice] = React.useState<
    "automation-created" | "automation-live" | null
  >(null);
  const stepRefs = React.useRef<Partial<Record<BuilderStepId, HTMLDivElement | null>>>({});
  const lastAutomationId = React.useRef<string | null>(null);

  const readiness = React.useMemo(
    () => (automation ? buildAutomationReadiness(automation) : null),
    [automation]
  );
  const readOnly = accessState === "unpaid" || accessState === "pro_expired";

  const { edit, enableEdit, disableEdit, inputRef } = useEditAutomation(id);
  React.useEffect(() => {
    if (edit) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [edit, inputRef]);

  React.useEffect(() => {
    if (!readiness) {
      return;
    }

    if (lastAutomationId.current !== id) {
      lastAutomationId.current = id;
      setActiveStep(readiness.firstIncompleteStepId);
    }
  }, [id, readiness]);

  React.useEffect(() => {
    const notice = searchParams?.get("onboarding_notice");
    if (notice === "automation-created") {
      setSuccessNotice("automation-created");
    }
  }, [searchParams]);

  const { mutate: deleteAutomationMutation, isPending: deletePending } =
    useDeleteAutomation(() => {
      setDeleteDialogOpen(false);
      setConfirmText("");
      toast("Deleted", {
        description: "Automation permanently deleted.",
      });
      router.push(automationsHref);
    });

  const { latestVariable: nameState } = useMutationDataState(["update-automation"]);
  const { latestVariable: channelState } = useMutationDataState([
    "update-automation-channel",
  ]);
  const { latestVariable: triggerState } = useMutationDataState(["add-trigger"]);
  const { latestVariable: postsState } = useMutationDataState(["attach-posts"]);
  const { latestVariable: keywordState } = useMutationDataState(["add-keyword"]);
  const { latestVariable: keywordDeleteState } = useMutationDataState([
    "delete-keyword",
  ]);
  const { latestVariable: listenerState } = useMutationDataState(["create-lister"]);
  const { latestVariable: activationState } = useMutationDataState(["activate"]);

  const syncStatus = React.useMemo(() => {
    const statuses = [
      nameState?.status,
      channelState?.status,
      triggerState?.status,
      postsState?.status,
      keywordState?.status,
      keywordDeleteState?.status,
      listenerState?.status,
      activationState?.status,
    ];

    if (statuses.some((status) => status === "pending")) {
      return { status: "pending" as const, label: "Saving changes..." };
    }

    if (statuses.some((status) => status === "error")) {
      return { status: "error" as const, label: "Last update failed" };
    }

    if (statuses.some((status) => status === "success")) {
      return { status: "success" as const, label: "All changes saved" };
    }

    return { status: "idle" as const, label: "Changes sync instantly" };
  }, [
    activationState?.status,
    channelState?.status,
    keywordDeleteState?.status,
    keywordState?.status,
    listenerState?.status,
    nameState?.status,
    postsState?.status,
    triggerState?.status,
  ]);

  const { mutate: toggleActivation, isPending: activationPending } = useMutationData(
    ["activate"],
    (payload: { state: boolean }) => activateAutomation(id, payload.state),
    {
      onMutate: (client, variables: { state: boolean }) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  active: variables.state,
                },
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
          },
        };
      },
      successToast: {
        context: "activation_toggle",
        title: (_data, variables) =>
          variables.state ? "Automation live" : "Automation disabled",
        description: (_data, variables) =>
          variables.state
            ? "Your automation is now active."
            : "Your automation has been turned off.",
      },
      errorToast: "activation_toggle",
      onSuccess: (data, variables) => {
        if (data?.status === 200) {
          setSuccessNotice(variables.state ? "automation-live" : null);
        }
      },
    }
  );

  const openStep = React.useCallback((stepId: BuilderStepId) => {
    setActiveStep(stepId);

    window.requestAnimationFrame(() => {
      stepRefs.current[stepId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  if (!automation || !readiness) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_28px_90px_-60px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Automation Builder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Automation unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This automation could not be loaded right now.
        </p>
        <Button asChild className="mt-6 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900">
          <DashboardLink href={automationsHref}>Back to automations</DashboardLink>
        </Button>
      </div>
    );
  }

  const keywordSuggestions = KEYWORD_SUGGESTIONS[automation.channel].filter(
    (suggestion) =>
      !automation.keywords.some(
        (keyword) => keyword.word.toLowerCase() === suggestion.toLowerCase()
      )
  );
  const availability = getBuilderChannelAvailability(automation);
  const remainingChecklist = readiness.checklist.filter((item) => !item.complete);
  const nextChecklistItem = remainingChecklist[0] ?? null;
  const showCreatedNotice = successNotice === "automation-created";
  const showLiveNotice = successNotice === "automation-live";

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_42%,#eef6ff_100%)] px-4 py-5 shadow-[0_35px_100px_-60px_rgba(15,23,42,0.45)] sm:rounded-[36px] sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_30%)]" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <DashboardLink
                href={automationsHref}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft className="size-4" />
                Back to automations
              </DashboardLink>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {edit ? (
                  <Input
                    ref={inputRef}
                    defaultValue={automation.name}
                    className="h-auto w-full max-w-2xl rounded-2xl border-slate-200 bg-white/90 px-4 py-3 text-2xl font-semibold tracking-tight text-slate-950 shadow-sm focus-visible:ring-slate-300 md:text-4xl"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        inputRef.current?.blur();
                      }

                      if (event.key === "Escape") {
                        disableEdit();
                      }
                    }}
                  />
                ) : (
                  <>
                    <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                      {automation.name}
                    </h1>
                    <button
                      type="button"
                      onClick={enableEdit}
                      disabled={readOnly}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"
                      aria-label="Rename automation"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur">
                  {readiness.channelLabel}
                </span>
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${getLifecycleTone(
                    readiness.lifecycleLabel
                  )}`}
                >
                  {readiness.lifecycleLabel}
                </span>
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${getSyncTone(
                    syncStatus.status
                  )}`}
                >
                  {syncStatus.status === "pending" ? (
                    <Loader2 className="mr-2 inline size-4 animate-spin" />
                  ) : syncStatus.status === "success" ? (
                    <CheckCheck className="mr-2 inline size-4" />
                  ) : syncStatus.status === "error" ? (
                    <TriangleAlert className="mr-2 inline size-4" />
                  ) : (
                    <Sparkles className="mr-2 inline size-4" />
                  )}
                  {syncStatus.label}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                {readiness.currentStatus}
              </p>
              {accessState !== "pro_active" ? (
                <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  {getBillingAccessMessage(accessState, [], automation.User?.subscription)}
                  <div className="mt-3">
                    <Button
                      asChild
                      size="sm"
                      className="rounded-lg bg-slate-950 text-white hover:bg-slate-900"
                    >
                  <DashboardLink href="/dashboard/settings">
                        {accessState === "free_active" ? "Upgrade to Pro" : "Continue Setup"}
                      </DashboardLink>
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-slate-200 bg-white/85 text-slate-600 hover:bg-white hover:text-slate-950"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-slate-200 bg-white p-1">
                  <DropdownMenuItem
                  onSelect={() => {
                    if (readOnly) return;
                    setDeleteDialogOpen(true);
                    setConfirmText("");
                  }}
                  disabled={readOnly}
                  className="cursor-pointer rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                >
                    <Trash2 className="size-4" />
                    Delete automation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => {
                  trackUxEvent("automation_activated", {
                    next_state: !automation.active,
                    automation_id: id,
                  });
                  toggleActivation({ state: !automation.active });
                }}
                disabled={readOnly || (!automation.active && !readiness.canGoLive) || activationPending}
                className="w-full rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900 sm:w-auto"
              >
                {activationPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Power className="size-4" />
                )}
                {automation.active ? "Disable" : "Go Live"}
              </Button>
              {!automation.active && !readiness.canGoLive ? (
                <p className="w-full text-left text-xs text-slate-500 sm:text-right">
                  Complete missing checklist items to enable Go Live.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="rounded-[28px] border border-white/85 bg-white/80 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Progress
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {readiness.completionCount}/{readiness.totalSteps} done
                  </p>
                </div>
                <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  {readiness.progressPercent}%
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_100%)] transition-all"
                  style={{ width: `${readiness.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                readiness.channelLabel,
                readiness.triggerLabel,
                `${automation.keywords.length} keywords`,
                readiness.needsPosts ? `${automation.posts.length} posts` : "DM flow",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/85 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showCreatedNotice ? (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                First automation ready
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-emerald-950">
                Your template is set up. Finish the missing steps, then go live.
              </h2>
              <p className="mt-1 text-sm text-emerald-900/80">
                Start with {nextChecklistItem?.label.toLowerCase() ?? "the setup below"} so this automation can begin replying.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setSuccessNotice(null);
                if (nextChecklistItem) {
                  openStep(nextChecklistItem.stepId);
                }
              }}
              className="rounded-xl bg-emerald-700 px-5 text-white hover:bg-emerald-800"
            >
              Continue setup
            </Button>
          </div>
        </section>
      ) : null}

      {showLiveNotice ? (
        <section className="rounded-[24px] border border-[#d2e3fc] bg-[#f8fbff] px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1a73e8]">
                Automation live
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                Replies are active. Monitor usage and results from your dashboard.
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                You can still return here later to refine posts, keywords, or the reply.
              </p>
            </div>
            <Button
              asChild
              className="rounded-xl bg-[#1a73e8] px-5 text-white hover:bg-[#1765cc]"
            >
              <DashboardLink href={automationsHref}>Back to automations</DashboardLink>
            </Button>
          </div>
        </section>
      ) : null}

      {!showCreatedNotice && accessState === "pro_active" && nextChecklistItem ? (
        <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Next step
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                {nextChecklistItem.label}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {NEXT_STEP_HELPERS[nextChecklistItem.id] ??
                  "Complete this step to move the automation forward."}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => openStep(nextChecklistItem.stepId)}
              className="rounded-xl bg-[#1a73e8] px-5 text-white hover:bg-[#1765cc]"
            >
              Open step
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)] xl:grid-cols-[minmax(0,1.85fr)_380px]">
        <aside className="order-1 flex min-w-0 flex-col gap-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(160deg,#ffffff_0%,#f8fafc_60%,#f0f9ff_100%)] p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.4)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Next actions
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Focus now
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {remainingChecklist.length} left
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {remainingChecklist.length > 0 ? (
                remainingChecklist.map((item) => (
                  <ChecklistItem key={item.id} item={item} onClick={openStep} compact />
                ))
              ) : (
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  Everything is ready. Use Go Live when you are done.
                </div>
              )}
            </div>
          </section>
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Billing status
            </p>
            <div className="mt-3">
              <BillingStatus
                subscription={automation.User?.subscription}
                usage={usage}
                compact
              />
            </div>
          </section>
        </aside>

        <div className={cn("order-2 min-w-0 flex flex-col gap-5 lg:order-1", readOnly && "pointer-events-none opacity-70")}>
          <BuilderStepCard
            stepNumber={1}
            stepId="setup"
            title="Channel & trigger"
            description="Choose the channel, trigger, and compatibility rules for this automation."
            summary={readiness.steps[0].summary}
            complete={readiness.steps[0].complete}
            open={activeStep === "setup"}
            onOpen={openStep}
            containerRef={(element) => {
              stepRefs.current.setup = element;
            }}
          >
            <SetupStep
              automationId={id}
              automation={automation}
              integrationsHref={integrationsHref}
              availability={availability}
            />
          </BuilderStepCard>

          <BuilderStepCard
            stepNumber={2}
            stepId="posts"
            title="Selected posts"
            description={readiness.steps[1].description}
            summary={readiness.steps[1].summary}
            complete={readiness.steps[1].complete}
            optional={readiness.steps[1].optional}
            open={activeStep === "posts"}
            onOpen={openStep}
            containerRef={(element) => {
              stepRefs.current.posts = element;
            }}
          >
            <PostsStep automationId={id} automation={automation} integrationsHref={integrationsHref} />
          </BuilderStepCard>

          <BuilderStepCard
            stepNumber={3}
            stepId="keywords"
            title="Trigger keywords"
            description="Add the words that should activate this workflow."
            summary={readiness.steps[2].summary}
            complete={readiness.steps[2].complete}
            open={activeStep === "keywords"}
            onOpen={openStep}
            containerRef={(element) => {
              stepRefs.current.keywords = element;
            }}
          >
            <KeywordsStep
              automationId={id}
              automation={automation}
              suggestions={keywordSuggestions}
            />
          </BuilderStepCard>

          <BuilderStepCard
            stepNumber={4}
            stepId="response"
            title={readiness.steps[3].title}
            description={readiness.steps[3].description}
            summary={readiness.steps[3].summary}
            complete={readiness.steps[3].complete}
            open={activeStep === "response"}
            onOpen={openStep}
            containerRef={(element) => {
              stepRefs.current.response = element;
            }}
          >
            <ResponseStep automationId={id} automation={automation} />
          </BuilderStepCard>

          <BuilderStepCard
            stepNumber={5}
            stepId="review"
            title="Readiness review"
            description="Check what is ready, jump to anything incomplete, and use the page header when you are ready to go live."
            summary={readiness.steps[4].summary}
            complete={readiness.steps[4].complete}
            open={activeStep === "review"}
            onOpen={openStep}
            containerRef={(element) => {
              stepRefs.current.review = element;
            }}
          >
            <ReviewStep
              checklist={readiness.checklist}
              canGoLive={readiness.canGoLive}
              isLive={automation.active}
              currentStatus={readiness.currentStatus}
              onOpenStep={openStep}
            />
          </BuilderStepCard>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[28px] border-slate-200 bg-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-950">
              Delete automation permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This cannot be undone. Type DELETE to confirm this permanent action.
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
              disabled={deletePending}
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePending || confirmText !== "DELETE"}
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={(event) => {
                event.preventDefault();
                deleteAutomationMutation({ automationId: id });
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

export default AutomationBuilder;
