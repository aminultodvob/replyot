import { getAllAutomations } from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import OnboardingBanner from "@/components/global/onboarding-banner";
import { INTEGRATION_CARDS } from "@/constants/integrations";
import {
  getBillingAccessState,
  getCurrentBillingUsageFromCollection,
  getPlanCapabilities,
} from "@/lib/billing";
import {
  getIntegrationFeedbackMessage,
  getOnboardingBanner,
  getOnboardingStage,
} from "@/lib/ux-flow";
import React from "react";
import IntegrationCard from "../[slug]/integrations/_components/integration-card";

type Props = {
  searchParams?: {
    integration_error?: string;
    integration_notice?: string;
  };
};

async function page({ searchParams }: Props) {
  const [userResult, automationsResult] = await Promise.all([
    onUserInfo(),
    getAllAutomations(),
  ]);
  const profile = userResult.status === 200 ? userResult.data : null;
  const automations = automationsResult.status === 200 ? automationsResult.data : [];
  const accessState = getBillingAccessState(
    profile?.subscription,
    getCurrentBillingUsageFromCollection(profile?.billingUsage, profile?.subscription)
  );
  const integrations =
    userResult.status === 200 ? userResult.data?.integrations ?? [] : [];
  const readOnly = accessState === "pro_expired";
  const capabilities = getPlanCapabilities(profile?.subscription?.plan ?? "FREE");
  const readyIntegrations = integrations.filter((integration) =>
    integration.name === "FACEBOOK_MESSENGER"
      ? Boolean(integration.token && integration.facebookPageId)
      : Boolean(integration.token)
  );
  const connectedCount = readyIntegrations.length;
  const onboardingStage = getOnboardingStage(profile, automations);
  const onboardingBanner = getOnboardingBanner(onboardingStage);
  const noticeCode = searchParams?.integration_notice;
  const errorCode = searchParams?.integration_error;
  const noticeMessage = getIntegrationFeedbackMessage(noticeCode ?? null);
  const errorMessage = getIntegrationFeedbackMessage(errorCode ?? null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-y-5 pb-8 sm:gap-y-6 sm:pb-10">
      <div className="app-panel rounded-[28px] px-5 py-6 shadow-sm sm:rounded-[32px] sm:px-8 sm:py-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Integrations
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-600 sm:text-base">
          Connect Instagram and Facebook once, then use them across all automations.
        </p>
        {readOnly ? (
          <p className="mt-6 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 shadow-sm">
            Billing is inactive. Existing integrations stay visible, but reconnecting and switching pages are locked until renewal.
          </p>
        ) : null}
        {errorMessage ? (
          <p className="mt-6 rounded-[20px] border border-rose-200/60 bg-rose-50/80 px-5 py-4 text-sm font-medium text-rose-800 shadow-sm backdrop-blur-md">
            {errorMessage}
          </p>
        ) : null}
        {!errorMessage && noticeMessage ? (
          <p className="mt-6 rounded-[20px] border border-emerald-200/60 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur-md">
            {noticeMessage}
          </p>
        ) : null}
      </div>
      {onboardingBanner ? <OnboardingBanner banner={onboardingBanner} compact /> : null}
      <div className="flex flex-col gap-y-5">
        {INTEGRATION_CARDS.map((card, key) => {
          const matchedIntegration = integrations.find(
            (integration) => integration.name === card.strategy
          );
          const isReady =
            card.strategy === "FACEBOOK_MESSENGER"
              ? Boolean(matchedIntegration?.token && matchedIntegration?.facebookPageId)
              : Boolean(matchedIntegration?.token);

          const connectedLabel =
            card.strategy === "FACEBOOK_MESSENGER"
              ? matchedIntegration?.pageName
                ? `Page: ${matchedIntegration.pageName}`
                : matchedIntegration?.facebookPageId
                  ? `Page ID: ${matchedIntegration.facebookPageId}`
                  : matchedIntegration
                    ? "Page not selected yet"
                    : undefined
              : undefined;
          const blockedReason =
            !isReady &&
            capabilities.plan === "FREE" &&
            connectedCount >= capabilities.maxConnectedChannels
              ? "Free supports one connected channel at a time. Disconnect the current channel or upgrade to Pro."
              : undefined;

          return (
            <IntegrationCard
              key={key}
              {...card}
              integrated={isReady}
              connectedLabel={connectedLabel}
              integrationId={matchedIntegration?.id}
              readOnly={readOnly}
              blockedReason={blockedReason}
            />
          );
        })}
      </div>
    </div>
  );
}

export default page;
