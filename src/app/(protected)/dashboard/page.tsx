import { getAllAutomations } from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import BillingStatus from "@/components/global/billing/billing-status";
import DashboardLink from "@/components/global/dashboard/link";
import OnboardingBanner from "@/components/global/onboarding-banner";
import { Button } from "@/components/ui/button";
import {
  FREE_AUTOMATION_LIMIT,
  FREE_TOTAL_DELIVERY_LIMIT,
  formatBillingPrice,
  getBillingAccessState,
  getBillingCycleLabel,
  getCurrentBillingUsageFromCollection,
  getCurrentPackageState,
  getFreeUsageTotal,
  getPlanCapabilities,
  getUsageDisplayItems,
} from "@/lib/billing";
import { getNextBestAction, getOnboardingBanner, getOnboardingStage } from "@/lib/ux-flow";
import { ArrowRight } from "lucide-react";
import React from "react";

const Page = async () => {
  const [automationsResult, userResult] = await Promise.all([
    getAllAutomations(),
    onUserInfo(),
  ]);

  const automations = automationsResult.status === 200 ? automationsResult.data : [];
  const profile = userResult.status === 200 ? userResult.data : null;
  const integrations = profile?.integrations ?? [];
  const currentUsage = getCurrentBillingUsageFromCollection(
    profile?.billingUsage,
    profile?.subscription
  );
  const accessState = getBillingAccessState(profile?.subscription, currentUsage);
  const packageState = getCurrentPackageState(profile?.subscription, currentUsage);
  const capabilities = getPlanCapabilities(profile?.subscription?.plan ?? "FREE");
  const usageItems = getUsageDisplayItems(profile?.subscription, currentUsage);
  const onboardingStage = getOnboardingStage(profile, automations);
  const nextAction = getNextBestAction(onboardingStage);
  const onboardingBanner = getOnboardingBanner(onboardingStage);

  const activeAutomations = automations.filter((automation) => automation.active).length;
  const connectedChannels = integrations.filter((integration) =>
    integration.name === "INSTAGRAM"
      ? Boolean(integration.token)
      : Boolean(integration.token) && Boolean(integration.facebookPageId)
  ).length;
  const totalKeywords = automations.reduce(
    (current, automation) => current + automation.keywords.length,
    0
  );
  const totalInteractions = automations.reduce(
    (current, automation) =>
      current +
      (automation.listener?.commentCount ?? 0) +
      (automation.listener?.dmCount ?? 0),
    0
  );

  const recentAutomations = [...automations]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 5);

  const firstName = profile?.firstname?.trim() || "there";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-8 sm:gap-6 sm:pb-10">
      <section className="app-panel rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-8 sm:py-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm font-medium text-zinc-600 sm:text-base">{nextAction.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-100/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
            {capabilities.label}
          </span>
          {capabilities.plan === "FREE" ? (
            <>
              <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-600">
                1 connected channel
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-600">
                {FREE_AUTOMATION_LIMIT} automation
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-600">
                {FREE_TOTAL_DELIVERY_LIMIT} total deliveries
              </span>
            </>
          ) : (
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-600">
              {formatBillingPrice()} / {getBillingCycleLabel()}
            </span>
          )}
        </div>
        <Button
          asChild
          size="lg"
          className="mt-6 w-full rounded-full bg-zinc-900 px-6 font-semibold text-white shadow-md hover:bg-zinc-800 hover:shadow-lg sm:w-auto"
        >
          <DashboardLink href={nextAction.href}>
            {nextAction.label}
            <ArrowRight size={16} className="ml-2" />
          </DashboardLink>
        </Button>
        {onboardingBanner ? (
          <div className="mt-6">
            <OnboardingBanner banner={onboardingBanner} hideCta />
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active automations", value: activeAutomations },
          { label: "Connected channels", value: connectedChannels },
          { label: "Tracked keywords", value: totalKeywords },
          {
            label: capabilities.plan === "FREE" ? "Used deliveries" : "Interactions",
            value:
              capabilities.plan === "FREE"
                ? getFreeUsageTotal(currentUsage)
                : totalInteractions,
          },
        ].map((item) => (
          <div key={item.label} className="app-panel rounded-[24px] px-5 py-5 transition-shadow hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{item.label}</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {profile?.subscription ? (
        <BillingStatus subscription={profile.subscription} usage={currentUsage} compact />
      ) : null}

      {packageState === "free_active" ? (
        <section className="app-panel grid gap-6 overflow-hidden rounded-[28px] border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 px-5 py-6 shadow-sm sm:rounded-[32px] sm:px-8 sm:py-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Free package</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Ready to do more?</h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-600 sm:text-base">
                Start with one channel, one automation, and {FREE_TOTAL_DELIVERY_LIMIT} total deliveries each {getBillingCycleLabel()}. When you hit a limit, upgrade to unlock unlimited channels.
              </p>
            </div>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-blue-600 px-6 font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 sm:w-auto"
              >
                <DashboardLink href="/dashboard/settings">
                  Upgrade to Pro
                </DashboardLink>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {usageItems.map((item) => (
              <div key={item.key} className="rounded-[24px] border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900">
                  {item.remaining} left
                </p>
              </div>
            ))}
            <div className="rounded-[24px] border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-md sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pro unlocks</p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">Full Access across both channels</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="app-panel rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Recent automations</h2>
          <DashboardLink
            href="/dashboard/automations"
            className="inline-flex w-full items-center justify-center rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 sm:w-auto"
          >
            View all
          </DashboardLink>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {recentAutomations.length > 0 ? (
            recentAutomations.map((automation) => (
              <DashboardLink
                key={automation.id}
                href={`/dashboard/automations/${automation.id}`}
                className="group flex flex-col justify-between gap-4 rounded-[20px] border border-zinc-200/60 bg-zinc-50/50 px-5 py-4 transition hover:bg-white hover:shadow-sm sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-zinc-900 transition-colors group-hover:text-blue-600">
                    {automation.name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {automation.channel === "FACEBOOK_MESSENGER"
                      ? "Facebook Messenger"
                      : automation.channel === "WHATSAPP"
                        ? "WhatsApp"
                        : "Instagram"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${
                      automation.active
                        ? "bg-emerald-100/50 text-emerald-700"
                        : "bg-zinc-200/50 text-zinc-600"
                    }`}
                  >
                    {automation.active ? "Live" : "Draft"}
                  </span>
                  <div className="hidden rounded-full bg-zinc-100 p-2 text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 sm:flex">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </DashboardLink>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 text-center">
              <p className="text-base font-medium text-zinc-500">No automations created yet.</p>
              <Button asChild variant="outline" className="mt-4 rounded-full border-zinc-200 bg-white shadow-sm hover:bg-zinc-50">
                 <DashboardLink href="/dashboard/automations">
                   Create your first automation
                 </DashboardLink>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Page;
