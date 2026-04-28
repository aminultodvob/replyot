"use client";

import { AUTOMATION_CHANNELS, AUTOMATION_TRIGGERS } from "@/constants/automation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useAutomationPosts,
  useKeywords,
  useListener,
  useTriggers,
} from "@/hooks/use-automations";
import { useQueryAutomationPosts } from "@/hooks/user-queries";
import { cn } from "@/lib/utils";
import type { AutomationDetailResponse } from "@/types/dashboard";
import type { InstagramPostProps } from "@/types/posts.type";
import Image from "next/image";
import React from "react";
import DashboardLink from "../dashboard/link";
import Loader from "../loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  ImagePlus,
  Lock,
  MessageSquareText,
  PlugZap,
  Trash2,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import type { BuilderStepId, ReadinessChecklistItem } from "./readiness";
import type { BuilderChannelAvailability } from "./channel-availability";

export type StepCardProps = {
  stepNumber: number;
  stepId: BuilderStepId;
  title: string;
  description: string;
  summary: string;
  complete: boolean;
  optional?: boolean;
  open: boolean;
  onOpen: (stepId: BuilderStepId) => void;
  containerRef?: (element: HTMLDivElement | null) => void;
  children: React.ReactNode;
};

export const KEYWORD_SUGGESTIONS = {
  INSTAGRAM: ["price", "details", "shop", "info", "link"],
  FACEBOOK_MESSENGER: ["info", "pricing", "details", "help", "book"],
  WHATSAPP: ["price", "details", "support", "order", "help"],
} as const;

export const truncateText = (value: string, length = 110) => {
  if (!value.trim()) {
    return "";
  }

  if (value.length <= length) {
    return value.trim();
  }

  return `${value.slice(0, length).trim()}...`;
};

const getStepTone = ({
  complete,
  optional,
  open,
}: {
  complete: boolean;
  optional?: boolean;
  open: boolean;
}) => {
  if (complete) {
    return {
      label: "Complete",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (open) {
    return {
      label: "Current step",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  if (optional) {
    return {
      label: "Optional",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  return {
    label: "Needs setup",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  };
};

export const PostMediaPreview = ({
  mediaUrl,
  mediaType,
  className,
}: {
  mediaUrl: string;
  mediaType: InstagramPostProps["media_type"];
  className?: string;
}) => {
  if (!mediaUrl) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-slate-100 text-slate-400",
          className
        )}
      >
        <ImagePlus className="size-6" />
      </div>
    );
  }

  if (mediaType === "VIDEO") {
    return (
      <video
        className={cn("h-full w-full object-cover", className)}
        muted
        playsInline
        preload="metadata"
        src={mediaUrl}
      />
    );
  }

  return (
    <Image
      fill
      unoptimized
      sizes="100vw"
      src={mediaUrl}
      alt="Post preview"
      className={cn("object-cover", className)}
    />
  );
};

export const BuilderStepCard = ({
  stepNumber,
  stepId,
  title,
  description,
  summary,
  complete,
  optional,
  open,
  onOpen,
  containerRef,
  children,
}: StepCardProps) => {
  const tone = getStepTone({ complete, optional, open });

  return (
    <section
      ref={containerRef}
      className={cn(
        "overflow-hidden rounded-[30px] border p-5 transition-all duration-200 md:p-6",
        open
          ? "border-slate-200 bg-white shadow-[0_28px_90px_-55px_rgba(15,23,42,0.28)]"
          : "border-slate-200/90 bg-white/88 shadow-[0_18px_48px_-48px_rgba(15,23,42,0.3)]"
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(stepId)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-4">
              <span
                className={cn(
                  "mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                  open || complete
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {stepNumber}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    {title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      tone.className
                    )}
                  >
                    {tone.label}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  {description}
                </p>
                {!open ? (
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-700">
                    {summary}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="hidden text-sm font-medium text-slate-500 lg:inline">
              {open ? "Collapse" : "Open"}
            </span>
            <ChevronDown
              className={cn("size-5 transition-transform", open && "rotate-180")}
            />
          </div>
        </div>
      </button>

      {open ? <div className="mt-6 border-t border-slate-200 pt-6">{children}</div> : null}
    </section>
  );
};

export const ChecklistItem = ({
  item,
  onClick,
  compact = false,
}: {
  item: ReadinessChecklistItem;
  onClick?: (stepId: BuilderStepId) => void;
  compact?: boolean;
}) => {
  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
          item.complete
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        )}
      >
        {item.complete ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{item.label}</span>
        <span className="mt-1 block text-xs text-slate-500">
          {item.complete ? "Ready" : "Open this step to finish setup"}
        </span>
      </span>
      {!item.complete ? (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Fix
        </span>
      ) : null}
    </>
  );

  if (item.complete || !onClick) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3",
          compact && "px-3 py-2.5"
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(item.stepId)}
      className={cn(
        "flex w-full items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_30px_-22px_rgba(15,23,42,0.35)]",
        compact && "px-3 py-2.5"
      )}
    >
      {content}
    </button>
  );
};

export const PostsPicker = ({
  automationId,
  channel,
  initialPosts,
  integrationsHref,
  label,
}: {
  automationId: string;
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
  initialPosts: {
    postid: string;
    caption?: string | null;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[];
  integrationsHref: string;
  label: string;
}) => {
  const isMobile = useIsMobile();
  const isFacebook = channel === "FACEBOOK_MESSENGER";
  const isWhatsApp = channel === "WHATSAPP";
  const [open, setOpen] = React.useState(false);
  const { data } = useQueryAutomationPosts(open, channel);
  const { posts, onSelectPost, mutate, isPending } = useAutomationPosts(
    automationId,
    initialPosts.map((post) => ({
      postid: post.postid,
      caption: post.caption ?? undefined,
      media: post.media,
      mediaType: post.mediaType,
    }))
  );

  const successBody =
    data?.status === 200 && data.data && typeof data.data === "object" && "data" in data.data
      ? (data.data as { data: unknown }).data
      : null;
  const mediaList = Array.isArray(successBody) ? (successBody as InstagramPostProps[]) : null;
  const errorPayload =
    data && data.status !== 200 && data.data && typeof data.data === "object"
      ? (data.data as { message?: string; needsReconnect?: boolean })
      : null;

  const pickerBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            {label}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {isFacebook
              ? "Pick the posts this flow should watch."
              : "Pick the posts this flow should watch."}
          </p>
        </div>
        <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          {posts.length} selected
        </div>
      </div>

      {isWhatsApp ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <PlugZap className="size-10 text-slate-300" />
          <h4 className="mt-4 text-lg font-semibold text-slate-900">
            WhatsApp does not use posts
          </h4>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            WhatsApp automations trigger from inbound messages only, so there are no posts to attach here.
          </p>
        </div>
      ) : !data ? (
        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto overscroll-contain pb-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[220px] rounded-[24px] sm:h-[260px]" />
          ))}
        </div>
      ) : mediaList && mediaList.length > 0 ? (
        <>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto overscroll-contain pb-2 pr-1 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {mediaList.map((post) => {
              const selected = posts.some((item) => item.postid === post.id);

              return (
                <button
                  type="button"
                  key={post.id}
                  onClick={() =>
                    onSelectPost({
                      postid: post.id,
                      media: post.media_url,
                      mediaType: post.media_type,
                      caption: post.caption,
                    })
                  }
                  className={cn(
                    "group relative flex min-h-[280px] flex-col overflow-hidden rounded-[22px] border bg-slate-50 text-left transition sm:min-h-[320px] sm:rounded-[26px]",
                    selected
                      ? "border-slate-950 shadow-[0_22px_55px_-35px_rgba(15,23,42,0.4)]"
                      : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300"
                  )}
                >
                  <div className="relative aspect-[4/3] shrink-0 sm:aspect-square">
                    <PostMediaPreview mediaUrl={post.media_url} mediaType={post.media_type} />
                    <div
                      className={cn(
                        "absolute inset-0 bg-slate-950/10 transition group-hover:bg-slate-950/5",
                        selected && "bg-slate-950/25"
                      )}
                    />
                    <span
                      className={cn(
                        "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-white transition",
                        selected
                          ? "border-white/20 bg-slate-950"
                          : "border-white/60 bg-black/20"
                      )}
                    >
                      {selected ? <Check className="size-4" /> : <Circle className="size-4" />}
                    </span>
                    {!post.media_url ? (
                      <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium text-slate-600">
                        {post.caption ? truncateText(post.caption, 80) : "Post preview unavailable"}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col space-y-2 p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {post.media_type === "VIDEO" ? "Video" : "Post"}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {post.caption
                        ? truncateText(post.caption, 88)
                        : isFacebook
                          ? "Facebook post without a message."
                          : "Instagram post without a caption."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <Button
              onClick={() =>
                mutate(undefined, {
                  onSuccess: () => setOpen(false),
                })
              }
              disabled={posts.length === 0}
              className="w-full rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900 sm:w-auto"
            >
              <Loader state={isPending}>
                {isFacebook ? "Save selected Facebook posts" : "Save selected posts"}
              </Loader>
            </Button>
          </div>
        </>
      ) : mediaList && mediaList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <ImagePlus className="size-10 text-slate-300" />
          <h4 className="mt-4 text-lg font-semibold text-slate-900">
            No posts available yet
          </h4>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {isFacebook
              ? "Publish something on this Page first, then come back to attach the posts you want to monitor."
              : "Publish something on Instagram first, then come back to attach the posts you want to monitor."}
          </p>
        </div>
      ) : data.status === 401 || errorPayload?.needsReconnect ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-12 text-center">
          <PlugZap className="size-10 text-amber-600" />
          <h4 className="mt-4 text-lg font-semibold text-amber-950">
            Reconnect the channel to load posts
          </h4>
          <p className="mt-2 max-w-md text-sm leading-6 text-amber-800">
            {errorPayload?.message ??
              "Your connection expired or was revoked. Reconnect the integration to load posts again."}
          </p>
          <Button
            asChild
            className="mt-5 rounded-2xl bg-amber-600 px-5 text-white hover:bg-amber-700"
          >
            <DashboardLink href={integrationsHref}>Open Integrations</DashboardLink>
          </Button>
        </div>
      ) : data.status === 404 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <PlugZap className="size-10 text-slate-300" />
          <h4 className="mt-4 text-lg font-semibold text-slate-900">
            Connect the required integration first
          </h4>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {errorPayload?.message ??
              "The required integration needs to be connected before posts can be loaded."}
          </p>
          <Button
            asChild
            className="mt-5 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900"
          >
            <DashboardLink href={integrationsHref}>Open Integrations</DashboardLink>
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <TriangleAlert className="size-10 text-rose-600" />
          <h4 className="mt-4 text-lg font-semibold text-rose-950">
            Could not load posts
          </h4>
          <p className="mt-2 max-w-md text-sm leading-6 text-rose-700">
            {errorPayload?.message ?? "Try again in a moment."}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-slate-200 bg-white px-5 text-slate-800 hover:bg-slate-50 sm:w-auto"
      >
        <ImagePlus className="size-4" />
        {label}
      </Button>

      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="h-[92dvh] rounded-t-[28px] border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-0"
          >
            <SheetHeader className="shrink-0 border-b border-slate-200 px-4 py-4 text-left sm:px-5 sm:py-5">
              <SheetTitle className="text-xl text-slate-950">{label}</SheetTitle>
              <SheetDescription className="text-sm text-slate-500">
                Select the posts that should trigger this automation.
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
              {pickerBody}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="flex max-h-[92vh] max-w-[min(1180px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_40px_120px_-55px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-6">
            <DialogHeader className="sr-only">
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription>Select the posts that should trigger this automation.</DialogDescription>
            </DialogHeader>
            {pickerBody}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export const SetupStep = ({
  automationId,
  automation,
  integrationsHref,
  availability,
}: {
  automationId: string;
  automation: NonNullable<AutomationDetailResponse["data"]>;
  integrationsHref: string;
  availability: BuilderChannelAvailability;
}) => {
  const { types, channel, onSetChannel, onSetTrigger, channelPending, isPending } =
    useTriggers(
      automationId,
      automation.channel ?? "INSTAGRAM",
      automation.trigger.map((item) => item.type),
      {
        autoSave: true,
        canSetChannel: (nextChannel) => availability.channels[nextChannel].selectable,
        canSetTrigger: (nextType) => availability.triggers[nextType].available,
      }
    );
  const selectedChannel = availability.channels[channel];
  const hasRequiredIntegration = selectedChannel.ready;
  const effectiveTriggers =
    channel === "FACEBOOK_MESSENGER"
      ? AUTOMATION_TRIGGERS.filter((trigger) => trigger.type === "COMMENT")
      : channel === "WHATSAPP"
        ? AUTOMATION_TRIGGERS.filter((trigger) => trigger.type === "DM")
      : AUTOMATION_TRIGGERS;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">Tap to switch. Saves instantly.</p>
        {(channelPending || isPending) ? (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Updating...
          </span>
        ) : null}
      </div>

      {!hasRequiredIntegration ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-950">
                {selectedChannel.lockReason?.title ??
                  (channel === "FACEBOOK_MESSENGER"
                    ? "Connect your Facebook Page."
                    : channel === "WHATSAPP"
                      ? "Connect WhatsApp Business."
                    : "Connect Instagram.")}
              </p>
              <p className="mt-1 text-sm text-amber-900">
                {selectedChannel.lockReason?.message ?? "This channel is required before choosing triggers."}
              </p>
            </div>
            <Button
              asChild
              className="rounded-2xl bg-amber-600 px-5 text-white hover:bg-amber-700"
            >
              <DashboardLink href={integrationsHref}>Open Integrations</DashboardLink>
            </Button>
          </div>
        </div>
      ) : null}

      {channel === "FACEBOOK_MESSENGER" ? (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-950">
            Facebook only supports comment triggers.
          </p>
        </div>
      ) : channel === "WHATSAPP" ? (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-950">
            WhatsApp only supports DM triggers.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {AUTOMATION_CHANNELS.map((option) => {
          const selected = channel === option.value;
          const optionAvailability = availability.channels[option.value];
          const disabled = !optionAvailability.selectable;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                onSetChannel(option.value);
              }}
              disabled={disabled}
              className={cn(
                "rounded-[26px] border p-5 text-left transition",
                selected && !disabled
                  ? "border-slate-950 bg-slate-950 text-white shadow-[0_26px_65px_-40px_rgba(15,23,42,0.6)]"
                  : disabled
                    ? "border-slate-300 bg-slate-100 text-slate-700"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-lg font-semibold tracking-tight sm:text-xl">{option.label}</p>
                <span
                  className={cn(
                    "w-fit rounded-full border px-2.5 py-1 text-xs font-semibold",
                    optionAvailability.status === "Connected"
                      ? selected && !disabled
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-700"
                  )}
                >
                  {optionAvailability.status}
                </span>
              </div>
              <p
                className={cn(
                  "mt-2 text-sm leading-6",
                  selected && !disabled ? "text-slate-200" : "text-slate-600"
                )}
              >
                {option.description}
              </p>
              {!optionAvailability.ready ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="size-4" />
                  {optionAvailability.lockReason?.title ?? "Needs connection"}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3">
        {effectiveTriggers.map((trigger) => {
          const selected = types.includes(trigger.type);
          const triggerAvailability = availability.triggers[trigger.type];
          const disabled = !triggerAvailability.available;

          return (
            <button
              type="button"
              key={trigger.id}
              onClick={() => {
                if (disabled) return;
                onSetTrigger(trigger.type);
              }}
              disabled={disabled}
              className={cn(
                "rounded-[26px] border p-5 text-left transition",
                selected && !disabled
                  ? "border-slate-950 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-white shadow-[0_26px_65px_-40px_rgba(15,23,42,0.7)]"
                  : disabled
                    ? "border-slate-300 bg-slate-100 text-slate-700"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300"
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 flex h-10 w-10 items-center justify-center rounded-2xl",
                      selected && !disabled
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {trigger.icon}
                  </span>
                  <div>
                    <p className="text-lg font-semibold tracking-tight">{trigger.label}</p>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-6",
                        selected && !disabled ? "text-slate-200" : "text-slate-600"
                      )}
                    >
                      {trigger.description}
                    </p>
                    {triggerAvailability.reason ? (
                      <p
                        className={cn(
                          "mt-2 flex items-center gap-2 text-sm font-medium",
                          selected && !disabled ? "text-slate-200" : "text-slate-700"
                        )}
                      >
                        <AlertCircle className="size-4" />
                        {triggerAvailability.reason}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-end">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-center text-xs font-semibold",
                      triggerAvailability.status === "Connected"
                        ? selected && !disabled
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : triggerAvailability.status === "Unavailable"
                          ? "border-slate-300 bg-white text-slate-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                    )}
                  >
                    {triggerAvailability.status}
                  </span>
                  <span
                    className={cn(
                      "mt-1 flex h-8 w-8 items-center justify-center rounded-full border",
                      selected
                        && !disabled
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    )}
                  >
                    {selected && !disabled ? (
                      <Check className="size-4" />
                    ) : (
                      <Circle className="size-4" />
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PostsStep = ({
  automationId,
  automation,
  integrationsHref,
}: {
  automationId: string;
  automation: NonNullable<AutomationDetailResponse["data"]>;
  integrationsHref: string;
}) => {
  const needsPosts = automation.trigger.some((trigger) => trigger.type === "COMMENT");

  if (!needsPosts) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
        <p className="text-sm font-semibold text-slate-900">
          Post targeting is optional for DM-only flows.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This automation can run without selecting posts because only the DM trigger is active.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">Pick where comments should trigger.</p>
        <PostsPicker
          automationId={automationId}
          channel={automation.channel}
          label={
            automation.channel === "FACEBOOK_MESSENGER"
              ? "Choose Facebook posts"
              : automation.channel === "WHATSAPP"
                ? "WhatsApp does not use posts"
              : "Choose Instagram posts"
          }
          initialPosts={automation.posts}
          integrationsHref={integrationsHref}
        />
      </div>

      {automation.posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {automation.posts.map((post) => (
            <div
              key={post.id}
              className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_20px_55px_-45px_rgba(15,23,42,0.35)]"
            >
              <div className="relative aspect-square">
                <PostMediaPreview mediaUrl={post.media} mediaType={post.mediaType} />
                {!post.media ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-4 text-center text-sm font-medium text-slate-600">
                    {post.caption ? truncateText(post.caption, 80) : "Post preview unavailable"}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Attached post
                </p>
                <p className="text-sm leading-6 text-slate-600">
                  {post.caption
                    ? truncateText(post.caption, 96)
                    : "This post will still be monitored even without a caption preview."}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <ImagePlus className="mx-auto size-10 text-slate-300" />
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
            No posts selected yet
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Choose the posts whose comments should trigger this automation. You can change this selection any time.
          </p>
        </div>
      )}
    </div>
  );
};

export const KeywordsStep = ({
  automationId,
  automation,
  suggestions,
}: {
  automationId: string;
  automation: NonNullable<AutomationDetailResponse["data"]>;
  suggestions: string[];
}) => {
  const { keyword, onValueChange, deleteMutation, submitKeyword } =
    useKeywords(automationId);

  return (
    <div className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-medium text-slate-500">Add words users will type.</p>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[360px]">
            <Input
              value={keyword}
              placeholder="Add keyword..."
              className="h-12 w-full rounded-2xl border-slate-200 bg-white px-4 text-slate-900"
              onChange={onValueChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitKeyword();
                }
              }}
            />
            <Button
              type="button"
              onClick={() => submitKeyword()}
              className="h-12 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900 sm:w-auto"
            >
              Add keyword
            </Button>
          </div>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submitKeyword(suggestion)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium capitalize text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {automation.keywords.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {automation.keywords.map((word) => (
            <div
              key={word.id}
              className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium capitalize text-emerald-700"
            >
              <span>{word.word}</span>
              <button
                type="button"
                aria-label={`Delete keyword ${word.word}`}
                onClick={() => deleteMutation({ id: word.id })}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-700/80 transition hover:bg-emerald-100 hover:text-emerald-900"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <WandSparkles className="mx-auto size-10 text-slate-300" />
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
            No keywords yet
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Add at least one keyword so the automation knows which incoming messages or comments should trigger the flow.
          </p>
        </div>
      )}
    </div>
  );
};

export const ResponseStep = ({
  automationId,
  automation,
}: {
  automationId: string;
  automation: NonNullable<AutomationDetailResponse["data"]>;
}) => {
  const isFacebook = automation.channel === "FACEBOOK_MESSENGER";
  const isWhatsApp = automation.channel === "WHATSAPP";
  const { register, onFormSubmit, isPending } = useListener(automationId, automation.channel, {
    listener: automation.listener?.listener,
    prompt: automation.listener?.prompt,
    reply: automation.listener?.commentReply,
  });

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-slate-500">
        {isFacebook
          ? "Write the public reply."
          : isWhatsApp
            ? "Write the WhatsApp message this flow sends."
            : "Write the message this flow sends."}
      </p>

      <form onSubmit={onFormSubmit} className="space-y-5">
        {isFacebook ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <label className="text-sm font-semibold text-slate-900">
              Public comment reply
            </label>
            <Textarea
              {...register("reply")}
              placeholder="Thanks for reaching out. We just sent you the details."
              className="mt-3 min-h-36 rounded-[24px] border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        ) : (
          <>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <label className="text-sm font-semibold text-slate-900">
                {isWhatsApp ? "WhatsApp reply" : "Direct message"}
              </label>
              <Textarea
                {...register("prompt")}
                placeholder="Hey! Thanks for commenting. Here are the details you asked for..."
                className="mt-3 min-h-40 rounded-[24px] border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <label className="text-sm font-semibold text-slate-900">
                Public comment reply
                <span className="ml-2 text-sm font-normal text-slate-500">(Optional)</span>
              </label>
              <Input
                {...register("reply")}
                placeholder="Sent you a DM with the details."
                className="mt-3 h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </>
        )}

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <MessageSquareText className="size-4 text-slate-500" />
            Preview
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {isFacebook
              ? truncateText(
                  automation.listener?.commentReply ??
                    automation.listener?.prompt ??
                    ""
                ) || "No public reply saved yet."
              : truncateText(automation.listener?.prompt ?? "") ||
                (isWhatsApp ? "No WhatsApp reply saved yet." : "No DM saved yet.")}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900"
        >
          <Loader state={isPending}>Save response</Loader>
        </Button>
      </form>
    </div>
  );
};

export const ReviewStep = ({
  checklist,
  canGoLive,
  isLive,
  currentStatus,
  onOpenStep,
}: {
  checklist: ReadinessChecklistItem[];
  canGoLive: boolean;
  isLive: boolean;
  currentStatus: string;
  onOpenStep: (stepId: BuilderStepId) => void;
}) => {
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-[28px] border px-5 py-5",
          canGoLive
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1 flex h-10 w-10 items-center justify-center rounded-2xl",
              canGoLive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}
          >
            {canGoLive ? <CheckCheck className="size-5" /> : <TriangleAlert className="size-5" />}
          </span>
          <div>
            <p className={cn("text-sm font-semibold", canGoLive ? "text-emerald-950" : "text-amber-950")}>
              {canGoLive
                ? isLive
                  ? "Automation is live."
                  : "Everything is ready to go live."
                : "A few setup items still need attention."}
            </p>
            <p
              className={cn(
                "mt-1 text-sm leading-6",
                canGoLive ? "text-emerald-800" : "text-amber-800"
              )}
            >
              {currentStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {checklist.map((item) => (
          <ChecklistItem key={item.id} item={item} onClick={onOpenStep} />
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
        <p className="text-sm font-medium text-slate-500">
          Use the top-right button to go live.
        </p>
      </div>
    </div>
  );
};
