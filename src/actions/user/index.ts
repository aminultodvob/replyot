"use server";

import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";

import {
  PAYMENT_HISTORY_STATUS,
  PAYMENT_PROVIDER,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
} from "@/db";
import { requireSessionUser } from "@/lib/auth";
import {
  BILLING_CYCLE_DAYS,
  BILLING_PACKAGE_AMOUNT,
  BILLING_PACKAGE_CURRENCY,
} from "@/lib/billing";
import { revalidateUserProfile } from "@/lib/cache-tags";
import { timeServerStep } from "@/lib/dev-timing";
import { refreshToken } from "@/lib/fetch";
import {
  matchesConfiguredAmount,
  matchesConfiguredCurrency,
  verifyUddoktaPayPayment,
} from "@/lib/uddoktapay";
import { updateIntegration } from "../integrations/queries";
import {
  activateProSubscription,
  createPendingPaymentHistory,
  findUser,
  listPaymentHistoryForUser,
  settlePaymentHistory,
} from "./queries";

export const onCurrentUser = async () => {
  return await requireSessionUser();
};

const getCachedUserProfile = (userId: string) =>
  unstable_cache(
    async () => timeServerStep(`findUser:${userId}`, () => findUser(userId)),
    ["user-profile", userId],
    {
      tags: [`user-profile:${userId}`],
      revalidate: 30,
    }
  )();

export const onBoardUser = async () => {
  const user = await onCurrentUser();

  try {
    const found = await getCachedUserProfile(user.id);

    if (!found) {
      return { status: 404 as const };
    }

    const instagramIntegration = found.integrations.find(
      (integration) => integration.name === "INSTAGRAM"
    );

    if (instagramIntegration) {
      const expiresAt =
        instagramIntegration.expiresAt instanceof Date
          ? instagramIntegration.expiresAt
          : instagramIntegration.expiresAt
            ? new Date(instagramIntegration.expiresAt)
            : null;

      if (expiresAt && !Number.isNaN(expiresAt.getTime())) {
        const today = new Date();
        const timeLeft = expiresAt.getTime() - today.getTime();
        const days = Math.round(timeLeft / (1000 * 3600 * 24));

        if (days < 5) {
          const refresh = await refreshToken(instagramIntegration.token);
          const expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + 60);

          await updateIntegration(
            refresh.access_token,
            expireDate,
            instagramIntegration.id
          );
        }
      }
    }

    return {
      status: 200 as const,
      data: {
        firstname: found.firstname,
        lastname: found.lastname,
      },
    };
  } catch (error) {
    console.log(error);
    return { status: 500 as const };
  }
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();

  try {
    const profile = await getCachedUserProfile(user.id);
    if (profile) {
      return { status: 200 as const, data: profile };
    }

    return { status: 404 as const };
  } catch (error) {
    console.log(error);
    return { status: 500 as const };
  }
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

const normalizePaymentHistoryStatus = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (
    ["COMPLETED", "SUCCESS", "SUCCEEDED", "PAID", "APPROVED"].includes(normalized)
  ) {
    return PAYMENT_HISTORY_STATUS.PAID;
  }

  if (["PENDING", "PROCESSING", "INITIATED"].includes(normalized)) {
    return PAYMENT_HISTORY_STATUS.PENDING;
  }

  if (["FAILED", "FAIL", "ERROR", "DECLINED"].includes(normalized)) {
    return PAYMENT_HISTORY_STATUS.FAILED;
  }

  if (["CANCELED", "CANCELLED", "CANCEL"].includes(normalized)) {
    return PAYMENT_HISTORY_STATUS.CANCELED;
  }

  if (["REFUND", "REFUNDED"].includes(normalized)) {
    return PAYMENT_HISTORY_STATUS.REFUNDED;
  }

  return null;
};

const createHistorySeed = (
  userId: string,
  subscriptionId: string | null | undefined,
  invoiceId: string,
  externalPaymentId?: string | null
) => ({
  userId,
  subscriptionId: subscriptionId ?? null,
  provider: PAYMENT_PROVIDER.UDDOKTAPAY,
  invoiceId,
  externalPaymentId: externalPaymentId ?? null,
  plan: SUBSCRIPTION_PLAN.PRO,
  amount: String(BILLING_PACKAGE_AMOUNT),
  currency: BILLING_PACKAGE_CURRENCY.toUpperCase(),
});

export const recordPendingPaymentHistory = async (
  userId: string,
  invoiceId: string,
  externalPaymentId?: string | null
) => {
  const profile = await findUser(userId);

  if (!profile?.subscription) {
    return { status: 404 as const, data: null };
  }

  const history = await createPendingPaymentHistory(
    createHistorySeed(userId, profile.subscription.id, invoiceId, externalPaymentId)
  );

  return { status: 200 as const, data: history };
};

export const recordPaymentHistoryStatus = async (
  userId: string,
  invoiceId: string,
  status: string,
  props?: {
    externalPaymentId?: string | null;
    amount?: string | number;
    currency?: string;
    paidAt?: Date | null;
  }
) => {
  const profile = await findUser(userId);
  const normalizedStatus = normalizePaymentHistoryStatus(status);

  if (!profile?.subscription || !normalizedStatus) {
    return { status: 404 as const, data: null };
  }

  const history = await settlePaymentHistory(invoiceId, {
    ...createHistorySeed(
      userId,
      profile.subscription.id,
      invoiceId,
      props?.externalPaymentId
    ),
    amount: String(props?.amount ?? BILLING_PACKAGE_AMOUNT),
    currency: (props?.currency ?? BILLING_PACKAGE_CURRENCY).toUpperCase(),
    status: normalizedStatus,
    paidAt: props?.paidAt ?? null,
  });

  revalidateUserProfile(userId);
  return { status: 200 as const, data: history };
};

export const getBillingHistory = async () => {
  const user = await onCurrentUser();

  try {
    const history = await listPaymentHistoryForUser(user.id);
    return { status: 200 as const, data: history };
  } catch (error) {
    console.log(error);
    return { status: 500 as const, data: [] };
  }
};

const settleVerifiedPayment = async (userId: string, invoiceId: string) => {
  const verified = await verifyUddoktaPayPayment(invoiceId);

  if (!verified.status) {
    return { status: 400 as const, error: "Payment verification failed" };
  }

  if (verified.invoice_id && verified.invoice_id !== invoiceId) {
    return { status: 400 as const, error: "Invoice verification mismatch" };
  }

  const metadata = verified.metadata ?? {};
  if (metadata.user_id !== userId) {
    return { status: 403 as const, error: "Payment does not belong to this user" };
  }

  if (metadata.plan && metadata.plan !== "PRO") {
    return { status: 400 as const, error: "Unsupported payment plan metadata" };
  }

  if (
    !matchesConfiguredAmount(verified.amount) ||
    !matchesConfiguredCurrency(verified.currency)
  ) {
    return { status: 400 as const, error: "Payment amount mismatch" };
  }

  try {
    const profile = await findUser(userId);
    if (!profile?.subscription) {
      return { status: 404 as const, error: "Subscription not found" };
    }

    if (profile.subscription.invoiceId === invoiceId) {
      return { status: 200 as const };
    }

    const now = new Date();
    const previousPeriodEnd =
      profile.subscription.status === SUBSCRIPTION_STATUS.ACTIVE &&
      toDate(profile.subscription.billingPeriodEnd) &&
      toDate(profile.subscription.billingPeriodEnd)!.getTime() > now.getTime()
        ? toDate(profile.subscription.billingPeriodEnd)!
        : now;

    const billingPeriodStart = previousPeriodEnd;
    const billingPeriodEnd = addDays(previousPeriodEnd, BILLING_CYCLE_DAYS);

    const subscribed = await activateProSubscription(userId, {
      billingPeriodStart,
      billingPeriodEnd,
      lastPaymentAt: now,
      externalPaymentId: verified.transaction_id ?? null,
      invoiceId,
    });

    if (subscribed) {
      await settlePaymentHistory(invoiceId, {
        ...createHistorySeed(
          userId,
          subscribed.id,
          invoiceId,
          verified.transaction_id ?? null
        ),
        amount: String(verified.amount ?? BILLING_PACKAGE_AMOUNT),
        currency: (verified.currency ?? BILLING_PACKAGE_CURRENCY).toUpperCase(),
        status: PAYMENT_HISTORY_STATUS.PAID,
        billingPeriodStart,
        billingPeriodEnd,
        paidAt: now,
      });
      revalidateUserProfile(userId);
      return { status: 200 as const };
    }

    return { status: 401 as const, error: "Unable to update subscription" };
  } catch (error) {
    console.log(error);
    return { status: 500 as const, error: "Unexpected payment error" };
  }
};

export const onSubscribe = async (invoiceId: string) => {
  const user = await onCurrentUser();
  return await settleVerifiedPayment(user.id, invoiceId);
};

export const onWebhookSubscribe = async (userId: string, invoiceId: string) => {
  return await settleVerifiedPayment(userId, invoiceId);
};

export const redirectToSignIn = () => {
  redirect("/sign-in");
};
