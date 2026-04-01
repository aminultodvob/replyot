import { getAllAutomations } from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import AutomationList from "@/components/global/automation-list";
import AutomationTemplates from "@/components/global/automation-templates";
import DashboardLink from "@/components/global/dashboard/link";
import OnboardingBanner from "@/components/global/onboarding-banner";
import { Button } from "@/components/ui/button";
import {
  getBillingAccessState,
  getCurrentBillingUsageFromCollection,
  getPlanCapabilities,
} from "@/lib/billing";
import { getNextBestAction, getOnboardingBanner, getOnboardingStage } from "@/lib/ux-flow";
import { ArrowRight } from "lucide-react";
import React from "react";

const Page = async () => {
  const [automations, userResult] = await Promise.all([
    getAllAutomations(),
    onUserInfo(),
  ]);
  const profile = userResult.status === 200 ? userResult.data : null;
  const integrations = profile?.integrations ?? [];
  const currentUsage = getCurrentBillingUsageFromCollection(
    profile?.billingUsage,
    profile?.subscription
  );
  const accessState = getBillingAccessState(profile?.subscription, currentUsage);

  const availableIntegrations = {
    INSTAGRAM: integrations.some(
      (integration) => integration.name === "INSTAGRAM" && Boolean(integration.token)
    ),
    FACEBOOK_MESSENGER: integrations.some(
      (integration) =>
        integration.name === "FACEBOOK_MESSENGER" &&
        Boolean(integration.token) &&
        Boolean(integration.facebookPageId)
    ),
  };

  const automationItems = automations.status === 200 ? automations.data : [];
  const onboardingStage = getOnboardingStage(profile, automationItems);
  const nextAction = getNextBestAction(onboardingStage);
  const onboardingBanner = getOnboardingBanner(onboardingStage);
  const liveCount = automationItems.filter((automation) => automation.active).length;
  const blockedCount = automationItems.filter(
    (automation) => !availableIntegrations[automation.channel]
  ).length;
  const readOnly = accessState === "pro_expired";
  const capabilities = getPlanCapabilities(profile?.subscription?.plan ?? "FREE");
  const canCreate = automationItems.length < capabilities.maxAutomations;
  const blockedReason =
    capabilities.plan === "FREE" && !canCreate
      ? `Free includes ${capabilities.maxAutomations} automation. Upgrade to Pro to create more.`
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-8 sm:gap-6 sm:pb-10">
      <section className="app-panel rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Automations
            </h1>
            <p className="mt-2 text-sm font-medium text-zinc-600 sm:text-base">
              Build, review, and launch workflows with a clear setup path.
            </p>
          </div>
          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap lg:mt-0">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-zinc-900 px-6 font-semibold text-white shadow-md hover:bg-zinc-800 hover:shadow-lg sm:w-auto"
            >
              <DashboardLink href={nextAction.href}>
                {nextAction.label}
                <ArrowRight size={16} className="ml-2" />
              </DashboardLink>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full border border-zinc-200/60 bg-white px-6 font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 sm:w-auto"
            >
              <DashboardLink href="/dashboard">Dashboard</DashboardLink>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Live automations", value: liveCount },
            { label: "Blocked by integration", value: blockedCount },
            {
              label:
                capabilities.plan === "FREE" ? "Automation limit" : "Templates",
              value:
                capabilities.plan === "FREE"
                  ? `${automationItems.length}/${capabilities.maxAutomations}`
                  : 3,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-zinc-200/50 bg-zinc-50/50 px-5 py-4 transition-shadow hover:shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {onboardingBanner ? <OnboardingBanner banner={onboardingBanner} compact /> : null}

      {automationItems.length === 0 ? (
        <section className="app-panel rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Recommended first automation
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Start with DM from Comments
              </h2>
              <p className="mt-4 text-base font-medium leading-relaxed text-zinc-600">
                It is the fastest way to see the full flow working: comment trigger, selected posts, keywords, and a reply path you can activate.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border border-zinc-200 bg-white px-6 font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              <DashboardLink href="/dashboard/integrations">
                {availableIntegrations.INSTAGRAM || availableIntegrations.FACEBOOK_MESSENGER
                  ? "Templates below"
                  : "Connect a channel first"}
              </DashboardLink>
            </Button>
          </div>
        </section>
      ) : null}

      {!readOnly ? (
        <AutomationTemplates
          availableIntegrations={availableIntegrations}
          canCreate={!readOnly && canCreate}
          blockedReason={blockedReason}
        />
      ) : (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-900 shadow-sm">
          Billing is inactive. Automations are visible, but creating/editing is locked until renewal.
        </div>
      )}

      <section className="app-panel rounded-[28px] px-5 py-6 sm:rounded-[32px] sm:px-8 sm:py-8">
        <div className="flex flex-wrap gap-3">
          <span
            className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
              availableIntegrations.INSTAGRAM
                ? "bg-emerald-100/50 text-emerald-700"
                : "bg-zinc-100/80 text-zinc-500"
            }`}
          >
            Instagram {availableIntegrations.INSTAGRAM ? "Connected" : "Missing"}
          </span>
          <span
            className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
              availableIntegrations.FACEBOOK_MESSENGER
                ? "bg-emerald-100/50 text-emerald-700"
                : "bg-zinc-100/80 text-zinc-500"
            }`}
          >
            Facebook {availableIntegrations.FACEBOOK_MESSENGER ? "Connected" : "Missing"}
          </span>
        </div>
        <div className="mt-8">
          <AutomationList
            initialData={automations}
            availableIntegrations={availableIntegrations}
            readOnly={readOnly}
            canCreate={!readOnly && canCreate}
            blockedReason={blockedReason}
          />
        </div>
      </section>
    </div>
  );
};

export default Page;
