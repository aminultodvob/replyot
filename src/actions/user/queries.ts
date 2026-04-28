"use server";

import { and, desc, eq, isNull } from "drizzle-orm";

import {
  billingUsage,
  db,
  passwordResetTokens,
  paymentHistory,
  processedExternalEvents,
  PAYMENT_HISTORY_STATUS,
  PAYMENT_PROVIDER,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
  subscriptions,
  users,
} from "@/db";
import type {
  PaymentHistoryStatus,
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/db";
import { BILLING_CYCLE_DAYS } from "@/lib/billing";

const isMissingProcessedEventTableError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
  };

  return (
    maybeError.code === "42P01" ||
    maybeError.message?.includes('relation "ProcessedExternalEvent" does not exist') === true
  );
};

const isMissingPaymentHistoryTableError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
  };

  return (
    maybeError.code === "42P01" ||
    maybeError.message?.includes('relation "PaymentHistory" does not exist') === true
  );
};

export const findUser = async (userId: string) => {
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      subscription: true,
      billingUsage: {
        orderBy: (table, { desc }) => [desc(table.periodStart)],
      },
      integrations: {
        columns: {
          id: true,
          token: true,
          expiresAt: true,
          name: true,
          instagramId: true,
          facebookPageId: true,
          pageName: true,
          whatsappBusinessAccountId: true,
          whatsappPhoneNumberId: true,
          whatsappBusinessPhone: true,
          whatsappDisplayName: true,
        },
      },
    },
  });
};

export const findUserByEmail = async (email: string) => {
  return await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      subscription: true,
      billingUsage: {
        orderBy: (table, { desc }) => [desc(table.periodStart)],
      },
      integrations: true,
      passwordResetTokens: {
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      },
    },
  });
};

export const findAuthUserByEmail = async (email: string) => {
  return await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: {
      id: true,
      email: true,
      passwordHash: true,
      firstname: true,
      lastname: true,
    },
  });
};

export const createUser = async (
  firstname: string,
  lastname: string,
  email: string,
  passwordHash: string
) => {
  return await db.transaction(async (tx) => {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + BILLING_CYCLE_DAYS);

    const [createdUser] = await tx
      .insert(users)
      .values({
        firstname,
        lastname,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
      });

    const [subscription] = await tx.insert(subscriptions).values({
      userId: createdUser.id,
      plan: SUBSCRIPTION_PLAN.FREE,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
    }).returning({
      id: subscriptions.id,
    });

    await tx.insert(billingUsage).values({
      userId: createdUser.id,
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
    });

    return createdUser;
  });
};

export const ensureBillingUsagePeriod = async (
  userId: string,
  subscriptionId: string | null,
  periodStart: Date,
  periodEnd: Date
) => {
  const [usage] = await db
    .insert(billingUsage)
    .values({
      userId,
      subscriptionId,
      periodStart,
      periodEnd,
    })
    .onConflictDoNothing({
      target: [billingUsage.userId, billingUsage.periodStart, billingUsage.periodEnd],
    })
    .returning();

  return usage ?? null;
};

export const updatePasswordHash = async (userId: string, passwordHash: string) => {
  return await db.transaction(async (tx) => {
    const [updatedUser] = await tx
      .update(users)
      .set({
        passwordHash,
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
      });

    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(
        and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt))
      );

    return updatedUser;
  });
};

export const createPasswordResetToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
) => {
  return await db.transaction(async (tx) => {
    await tx
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
      })
      .where(
        and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt))
      );

    const [token] = await tx
      .insert(passwordResetTokens)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning();

    return token;
  });
};

export const findPasswordResetToken = async (tokenHash: string) => {
  return await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.tokenHash, tokenHash),
    with: {
      User: true,
    },
  });
};

export const markPasswordResetTokenUsed = async (tokenId: string) => {
  const [token] = await db
    .update(passwordResetTokens)
    .set({
      usedAt: new Date(),
    })
    .where(eq(passwordResetTokens.id, tokenId))
    .returning();

  return token;
};

export const updateSubscription = async (
  userId: string,
  props: {
    plan?: SubscriptionPlan;
    provider?: PaymentProvider | null;
    status?: SubscriptionStatus;
    billingPeriodStart?: Date | null;
    billingPeriodEnd?: Date | null;
    lastPaymentAt?: Date | null;
    externalPaymentId?: string | null;
    invoiceId?: string | null;
    renewalReminderSentAt?: Date | null;
  }
) => {
  return await db.transaction(async (tx) => {
    const [subscription] = await tx
      .insert(subscriptions)
      .values({
        userId,
        plan: props.plan ?? SUBSCRIPTION_PLAN.FREE,
        provider: props.provider ?? null,
        status: props.status ?? SUBSCRIPTION_STATUS.INACTIVE,
        billingPeriodStart: props.billingPeriodStart ?? null,
        billingPeriodEnd: props.billingPeriodEnd ?? null,
        lastPaymentAt: props.lastPaymentAt ?? null,
        externalPaymentId: props.externalPaymentId ?? null,
        invoiceId: props.invoiceId ?? null,
        renewalReminderSentAt: props.renewalReminderSentAt ?? null,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          updatedAt: new Date(),
          ...(props.plan !== undefined ? { plan: props.plan } : {}),
          ...(props.provider !== undefined ? { provider: props.provider } : {}),
          ...(props.status !== undefined ? { status: props.status } : {}),
          ...(props.billingPeriodStart !== undefined
            ? { billingPeriodStart: props.billingPeriodStart }
            : {}),
          ...(props.billingPeriodEnd !== undefined
            ? { billingPeriodEnd: props.billingPeriodEnd }
            : {}),
          ...(props.lastPaymentAt !== undefined
            ? { lastPaymentAt: props.lastPaymentAt }
            : {}),
          ...(props.externalPaymentId !== undefined
            ? { externalPaymentId: props.externalPaymentId }
            : {}),
          ...(props.invoiceId !== undefined ? { invoiceId: props.invoiceId } : {}),
          ...(props.renewalReminderSentAt !== undefined
            ? { renewalReminderSentAt: props.renewalReminderSentAt }
            : {}),
        },
      })
      .returning();

    return subscription;
  });
};

export const activateProSubscription = async (
  userId: string,
  props: {
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    lastPaymentAt: Date;
    externalPaymentId?: string | null;
    invoiceId: string;
  }
) => {
  const subscription = await updateSubscription(userId, {
    plan: SUBSCRIPTION_PLAN.PRO,
    provider: PAYMENT_PROVIDER.UDDOKTAPAY,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    billingPeriodStart: props.billingPeriodStart,
    billingPeriodEnd: props.billingPeriodEnd,
    lastPaymentAt: props.lastPaymentAt,
    externalPaymentId: props.externalPaymentId ?? null,
    invoiceId: props.invoiceId,
  });

  if (!subscription?.userId) {
    return subscription;
  }

  await db
    .insert(billingUsage)
    .values({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      periodStart: props.billingPeriodStart,
      periodEnd: props.billingPeriodEnd,
    })
    .onConflictDoNothing({
      target: [billingUsage.userId, billingUsage.periodStart, billingUsage.periodEnd],
    });

  return subscription;
};

export const findCurrentBillingUsageByUserId = async (
  userId: string,
  periodStart: Date,
  periodEnd: Date
) => {
  return await db.query.billingUsage.findFirst({
    where: and(
      eq(billingUsage.userId, userId),
      eq(billingUsage.periodStart, periodStart),
      eq(billingUsage.periodEnd, periodEnd)
    ),
  });
};

export const findLatestBillingUsageByUserId = async (userId: string) => {
  return await db.query.billingUsage.findFirst({
    where: eq(billingUsage.userId, userId),
    orderBy: [desc(billingUsage.periodStart)],
  });
};

export const listPaymentHistoryForUser = async (userId: string) => {
  try {
    return await db.query.paymentHistory.findMany({
      where: eq(paymentHistory.userId, userId),
      orderBy: [desc(paymentHistory.paidAt), desc(paymentHistory.createdAt)],
    });
  } catch (error) {
    if (isMissingPaymentHistoryTableError(error)) {
      console.warn(
        "[billing] PaymentHistory table is missing. Returning empty billing history until migration is applied."
      );
      return [];
    }

    throw error;
  }
};

export const findPaymentHistoryByInvoiceId = async (invoiceId: string) => {
  try {
    return await db.query.paymentHistory.findFirst({
      where: eq(paymentHistory.invoiceId, invoiceId),
    });
  } catch (error) {
    if (isMissingPaymentHistoryTableError(error)) {
      console.warn(
        "[billing] PaymentHistory table is missing. Skipping invoice history lookup until migration is applied."
      );
      return null;
    }

    throw error;
  }
};

export const createPendingPaymentHistory = async (props: {
  userId: string;
  subscriptionId?: string | null;
  provider?: PaymentProvider;
  invoiceId: string;
  externalPaymentId?: string | null;
  plan?: SubscriptionPlan;
  amount: string;
  currency: string;
}) => {
  try {
    const [created] = await db
      .insert(paymentHistory)
      .values({
        userId: props.userId,
        subscriptionId: props.subscriptionId ?? null,
        provider: props.provider ?? PAYMENT_PROVIDER.UDDOKTAPAY,
        invoiceId: props.invoiceId,
        externalPaymentId: props.externalPaymentId ?? null,
        plan: props.plan ?? SUBSCRIPTION_PLAN.PRO,
        amount: props.amount,
        currency: props.currency,
        status: PAYMENT_HISTORY_STATUS.PENDING,
      })
      .onConflictDoNothing({
        target: paymentHistory.invoiceId,
      })
      .returning();

    return created ?? (await findPaymentHistoryByInvoiceId(props.invoiceId)) ?? null;
  } catch (error) {
    if (isMissingPaymentHistoryTableError(error)) {
      console.warn(
        "[billing] PaymentHistory table is missing. Skipping pending payment history write until migration is applied."
      );
      return null;
    }

    throw error;
  }
};

export const settlePaymentHistory = async (
  invoiceId: string,
  props: {
    userId: string;
    subscriptionId?: string | null;
    provider?: PaymentProvider;
    externalPaymentId?: string | null;
    plan?: SubscriptionPlan;
    amount: string;
    currency: string;
    status: PaymentHistoryStatus;
    billingPeriodStart?: Date | null;
    billingPeriodEnd?: Date | null;
    paidAt?: Date | null;
  }
) => {
  try {
    const [history] = await db
      .insert(paymentHistory)
      .values({
        userId: props.userId,
        subscriptionId: props.subscriptionId ?? null,
        provider: props.provider ?? PAYMENT_PROVIDER.UDDOKTAPAY,
        invoiceId,
        externalPaymentId: props.externalPaymentId ?? null,
        plan: props.plan ?? SUBSCRIPTION_PLAN.PRO,
        amount: props.amount,
        currency: props.currency,
        status: props.status,
        billingPeriodStart: props.billingPeriodStart ?? null,
        billingPeriodEnd: props.billingPeriodEnd ?? null,
        paidAt: props.paidAt ?? null,
      })
      .onConflictDoUpdate({
        target: paymentHistory.invoiceId,
        set: {
          updatedAt: new Date(),
          userId: props.userId,
          subscriptionId: props.subscriptionId ?? null,
          provider: props.provider ?? PAYMENT_PROVIDER.UDDOKTAPAY,
          externalPaymentId: props.externalPaymentId ?? null,
          plan: props.plan ?? SUBSCRIPTION_PLAN.PRO,
          amount: props.amount,
          currency: props.currency,
          status: props.status,
          billingPeriodStart: props.billingPeriodStart ?? null,
          billingPeriodEnd: props.billingPeriodEnd ?? null,
          paidAt: props.paidAt ?? null,
        },
      })
      .returning();

    return history ?? null;
  } catch (error) {
    if (isMissingPaymentHistoryTableError(error)) {
      console.warn(
        "[billing] PaymentHistory table is missing. Skipping settled payment history write until migration is applied."
      );
      return null;
    }

    throw error;
  }
};

export const findProcessedExternalEvent = async (
  provider: string,
  eventKey: string
) => {
  try {
    return await db.query.processedExternalEvents.findFirst({
      where: and(
        eq(processedExternalEvents.provider, provider),
        eq(processedExternalEvents.eventKey, eventKey)
      ),
    });
  } catch (error) {
    if (isMissingProcessedEventTableError(error)) {
      console.warn(
        "[billing] ProcessedExternalEvent table is missing. Skipping webhook dedupe lookup until migration is applied."
      );
      return null;
    }

    throw error;
  }
};

export const markProcessedExternalEvent = async (
  provider: string,
  eventKey: string,
  status: string = "SUCCESS"
) => {
  try {
    const [event] = await db
      .insert(processedExternalEvents)
      .values({
        provider,
        eventKey,
        status,
      })
      .onConflictDoNothing({
        target: [processedExternalEvents.provider, processedExternalEvents.eventKey],
      })
      .returning();

    return event ?? null;
  } catch (error) {
    if (isMissingProcessedEventTableError(error)) {
      console.warn(
        "[billing] ProcessedExternalEvent table is missing. Skipping webhook dedupe write until migration is applied."
      );
      return null;
    }

    throw error;
  }
};
