"use client";

import { Button } from "@/components/ui/button";
import { BILLING_PACKAGE_FEATURES, FREE_PACKAGE_FEATURES } from "@/constants/pages";
import { useSubscription } from "@/hooks/use-subscription";
import {
  formatFreePrice,
  formatBillingPrice,
  getBillingAccessState,
  getBillingCycleLabel,
} from "@/lib/billing";
import { CircleCheck, Loader2 } from "lucide-react";
import React from "react";
import { UserSubscription } from "@/types/dashboard";
import { trackUxEvent } from "@/lib/ux-analytics";

type BillingUsage = {
  facebookCommentReplies: number;
  instagramDmReplies: number;
  instagramCommentReplies: number;
} | null;

type Props = {
  subscription?: UserSubscription | null;
  usage?: BillingUsage;
  landing?: boolean;
};

const PaymentCard = ({ landing, subscription, usage }: Props) => {
  const { onSubscribe, isProcessing } = useSubscription();
  const accessState = getBillingAccessState(subscription, usage);
  const isFree = subscription?.plan !== "PRO";

  React.useEffect(() => {
    if (accessState === "quota_exhausted") {
      trackUxEvent("quota_warning_seen");
    }
  }, [accessState]);

  return (
    <div className="flex h-full flex-col rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">
        {isFree ? "Your current package: Free" : "Your current package: Pro"}
      </h2>
      <p className="mb-2 text-sm leading-6 text-slate-600">
        {isFree
          ? `You are on ${formatFreePrice()}. Keep building on Free, or upgrade when you need both channels, more automations, and higher monthly limits.`
          : "Your Pro package unlocks both channels, more automations, and higher monthly usage quotas."}
      </p>
      <span className="text-2xl font-bold tracking-tight text-slate-950">
        {isFree ? "Free package" : "Replyot Pro"}
      </span>
      <p className="mb-2 text-slate-700">
        <b className="text-xl">
          {isFree ? formatFreePrice() : formatBillingPrice()}
        </b>
        /{getBillingCycleLabel()}
      </p>
      <p className="mb-3 text-sm text-slate-500">
        {isFree
          ? "Upgrade when you need both channels, more automations, and higher monthly capacity."
          : "Renew Pro to keep the higher limits and both channels active for the next billing cycle."}
      </p>

      <div className="space-y-2">
        {(isFree ? FREE_PACKAGE_FEATURES : BILLING_PACKAGE_FEATURES).map((feature) => (
          <p key={feature} className="flex gap-2 text-sm text-slate-600">
            <CircleCheck className="mt-0.5 size-4 text-[#1a73e8]" />
            {feature}
          </p>
        ))}
      </div>

      {isFree ? (
        <div className="mt-5 rounded-2xl border border-[#d2e3fc] bg-[#f8fbff] p-4">
          <p className="text-sm font-medium text-slate-900">What Pro unlocks</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Both channels, more automations, and the full monthly delivery capacity when Free starts to feel tight.
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1a73e8]">
            {formatBillingPrice()}/{getBillingCycleLabel()}
          </p>
        </div>
      ) : null}

      <Button
        className="mt-6 rounded-xl bg-[#1a73e8] text-white hover:bg-[#1765cc]"
        disabled={isProcessing}
        onClick={() => {
          void onSubscribe();
        }}
      >
        {isProcessing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          isFree ? "Upgrade to Pro" : "Renew Pro"
        )}
      </Button>
    </div>
  );
};

export default PaymentCard;
