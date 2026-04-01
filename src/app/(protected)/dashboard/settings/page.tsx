import { getAllAutomations } from "@/actions/automations";
import { getBillingHistory, onUserInfo } from "@/actions/user";
import Billing from "@/components/global/billing";
import { getCurrentBillingUsageFromCollection } from "@/lib/billing";
import OnboardingBanner from "@/components/global/onboarding-banner";
import { getOnboardingBanner, getOnboardingStage } from "@/lib/ux-flow";

const Page = async () => {
  const [userResult, automationsResult, historyResult] = await Promise.all([
    onUserInfo(),
    getAllAutomations(),
    getBillingHistory(),
  ]);
  const profile = userResult.status === 200 ? userResult.data : null;
  const automations = automationsResult.status === 200 ? automationsResult.data : [];
  const subscription =
    userResult.status === 200 ? (userResult.data?.subscription ?? null) : null;
  const usage =
    userResult.status === 200
      ? getCurrentBillingUsageFromCollection(
          userResult.data?.billingUsage,
          userResult.data?.subscription
        )
      : null;
  const paymentHistory = historyResult.status === 200 ? historyResult.data : [];
  const onboardingStage = getOnboardingStage(profile, automations);
  const onboardingBanner = getOnboardingBanner(onboardingStage);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      {onboardingBanner ? <OnboardingBanner banner={onboardingBanner} compact /> : null}
      <Billing
        subscription={subscription}
        usage={usage}
        paymentHistory={paymentHistory}
      />
    </div>
  );
};

export default Page;
