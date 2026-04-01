"use client";
import BillingStatus from "./billing-status";
import PaymentCard from "./payment-card";
import type { PaymentHistoryItem, UserSubscription } from "@/types/dashboard";
import {
  formatBillingPrice,
  formatFreePrice,
  getBillingCycleLabel,
  getBillingAccessState,
  getCurrentBillingPeriodBounds,
  getSubscriptionDisplayStatus,
} from "@/lib/billing";
import { format } from "date-fns";
import PaymentHistory from "./payment-history";

type BillingUsage = {
  facebookCommentReplies: number;
  instagramDmReplies: number;
  instagramCommentReplies: number;
} | null;

type Props = {
  subscription: UserSubscription | null;
  usage: BillingUsage;
  paymentHistory: PaymentHistoryItem[];
};

function Billing({ subscription, usage, paymentHistory }: Props) {
  const status = getSubscriptionDisplayStatus(subscription);
  const accessState = getBillingAccessState(subscription, usage);
  const currentPeriod = getCurrentBillingPeriodBounds(subscription);
  const renewalDate = currentPeriod?.periodEnd
    ? format(currentPeriod.periodEnd, "dd MMM yyyy")
    : null;
  const isFree = subscription?.plan !== "PRO";
  const latestPayment = paymentHistory[0] ?? null;
  const paymentStatusLabel =
    latestPayment?.status === "PAID"
      ? "Paid"
      : latestPayment?.status === "PENDING"
        ? "Payment pending"
        : latestPayment?.status === "FAILED"
          ? "Payment failed"
          : latestPayment?.status === "CANCELED"
            ? "Canceled"
            : latestPayment?.status === "REFUNDED"
              ? "Refunded"
              : isFree
                ? "Free"
                : status === "ACTIVE"
                  ? "Active until"
                  : "Expired";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-6 sm:px-6 sm:py-7">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Plans & Billing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Review your current package, usage window, latest payment details, and billing history.
        </p>
        <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-medium text-slate-900">
            {isFree ? "Free package" : "Replyot Pro"}
          </span>
          <span>
            {isFree ? formatFreePrice() : formatBillingPrice()} / {getBillingCycleLabel()}
          </span>
          {renewalDate ? (
            <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs text-[#1a73e8]">
              {subscription?.plan === "FREE"
                ? `Resets ${renewalDate}`
                : status === "ACTIVE"
                  ? `Active until ${renewalDate}`
                  : `Locked since ${renewalDate}`}
            </span>
          ) : (
            <span className="rounded-full bg-[#f1f3f4] px-3 py-1 text-xs text-[#5f6368]">
              Upgrade available
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Current package
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {isFree ? "Free" : "Pro"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {isFree
                  ? `${formatFreePrice()} / ${getBillingCycleLabel()}`
                  : `${formatBillingPrice()} / ${getBillingCycleLabel()}`}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                paymentStatusLabel === "Paid" || paymentStatusLabel === "Free"
                  ? "bg-[#e6f4ea] text-[#137333]"
                  : paymentStatusLabel === "Payment pending"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
              }`}
            >
              {paymentStatusLabel}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs text-slate-500">
                {isFree ? "Free reset date" : "Active until"}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {renewalDate ?? "N/A"}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs text-slate-500">Last payment date</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {latestPayment?.paidAt
                  ? format(latestPayment.paidAt, "dd MMM yyyy")
                  : subscription?.lastPaymentAt
                    ? format(subscription.lastPaymentAt, "dd MMM yyyy")
                    : "No payment yet"}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs text-slate-500">Latest invoice</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-950">
                {latestPayment?.invoiceId ?? subscription?.invoiceId ?? "No invoice yet"}
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs text-slate-500">Reference</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-950">
                {latestPayment?.externalPaymentId ??
                  subscription?.externalPaymentId ??
                  "No reference yet"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            {paymentHistory.length > 0
              ? "Payment history starts from this release forward."
              : isFree
                ? "Free is active right now. Billing history will appear here after your first Pro payment."
                : accessState === "pro_expired"
                  ? "Older renewals may not appear here yet. The current summary still reflects your latest stored billing snapshot."
                  : "Your latest stored subscription snapshot is shown above while new payment history starts from this release."}
          </p>
        </section>

        <PaymentCard subscription={subscription} usage={usage} />
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Usage & access
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Keep an eye on limits, reset dates, and current package access.
          </p>
        </div>
        <BillingStatus subscription={subscription} usage={usage} />
      </section>

      <PaymentHistory paymentHistory={paymentHistory} />
    </div>
  );
}

export default Billing;
