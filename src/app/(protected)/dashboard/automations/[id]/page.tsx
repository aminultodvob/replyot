import { getAutomationInfo } from "@/actions/automations";
import { onUserInfo } from "@/actions/user";
import AutomationBuilder from "@/components/global/automation-builder";
import {
  getBillingAccessState,
  getCurrentBillingUsageFromCollection,
} from "@/lib/billing";

import React from "react";

type Props = {
  params: { id: string };
};

const Page = async ({ params }: Props) => {
  const [automation, userResult] = await Promise.all([
    getAutomationInfo(params.id),
    onUserInfo(),
  ]);
  const profile = userResult.status === 200 ? userResult.data : null;
  const currentUsage =
    userResult.status === 200
      ? getCurrentBillingUsageFromCollection(
          userResult.data?.billingUsage,
          userResult.data?.subscription
        )
      : null;
  const accessState = getBillingAccessState(
    profile?.subscription,
    currentUsage
  );

  return (
    <AutomationBuilder
      id={params.id}
      initialData={automation}
      accessState={accessState}
      usage={currentUsage}
    />
  );
};

export default Page;
