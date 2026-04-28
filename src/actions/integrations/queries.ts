"use server";

import { and, eq } from "drizzle-orm";

import { db, integrations, users } from "@/db";
import type { IntegrationName } from "@/db";

export const updateIntegration = async (
  token: string,
  expire: Date,
  id: string,
  meta?: {
    instagramId?: string;
    facebookPageId?: string;
    pageName?: string;
    whatsappBusinessAccountId?: string;
    whatsappPhoneNumberId?: string;
    whatsappBusinessPhone?: string;
    whatsappDisplayName?: string;
  }
) => {
  const [integration] = await db
    .update(integrations)
    .set({
      token,
      expiresAt: expire,
      instagramId: meta?.instagramId,
      facebookPageId: meta?.facebookPageId,
      pageName: meta?.pageName,
      whatsappBusinessAccountId: meta?.whatsappBusinessAccountId,
      whatsappPhoneNumberId: meta?.whatsappPhoneNumberId,
      whatsappBusinessPhone: meta?.whatsappBusinessPhone,
      whatsappDisplayName: meta?.whatsappDisplayName,
    })
    .where(eq(integrations.id, id))
    .returning();

  return integration;
};

export const getIntegration = async (
  userId: string,
  name: IntegrationName = "INSTAGRAM"
) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      integrations: {
        where: eq(integrations.name, name),
      },
    },
  });

  if (!user) {
    return undefined;
  }

  return {
    integrations: user.integrations,
  };
};

export const findIntegrationByInstagramId = async (instagramId: string) => {
  return await db.query.integrations.findFirst({
    where: eq(integrations.instagramId, instagramId),
    columns: {
      id: true,
      userId: true,
      name: true,
      instagramId: true,
    },
  });
};

export const findIntegrationByFacebookPageId = async (facebookPageId: string) => {
  return await db.query.integrations.findFirst({
    where: eq(integrations.facebookPageId, facebookPageId),
    columns: {
      id: true,
      userId: true,
      name: true,
      facebookPageId: true,
      pageName: true,
    },
  });
};

export const findIntegrationByWhatsAppPhoneNumberId = async (
  whatsappPhoneNumberId: string
) => {
  return await db.query.integrations.findFirst({
    where: eq(integrations.whatsappPhoneNumberId, whatsappPhoneNumberId),
    columns: {
      id: true,
      userId: true,
      name: true,
      whatsappBusinessAccountId: true,
      whatsappPhoneNumberId: true,
      whatsappBusinessPhone: true,
      whatsappDisplayName: true,
    },
  });
};

export const createIntegration = async (
  userId: string,
  name: IntegrationName,
  token: string,
  expire: Date,
  meta?: {
    instagramId?: string;
    facebookPageId?: string;
    pageName?: string;
    whatsappBusinessAccountId?: string;
    whatsappPhoneNumberId?: string;
    whatsappBusinessPhone?: string;
    whatsappDisplayName?: string;
  }
) => {
  return await db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!user) {
      return undefined;
    }

    await tx.insert(integrations).values({
      userId: user.id,
      name,
      token,
      expiresAt: expire,
      instagramId: meta?.instagramId,
      facebookPageId: meta?.facebookPageId,
      pageName: meta?.pageName,
      whatsappBusinessAccountId: meta?.whatsappBusinessAccountId,
      whatsappPhoneNumberId: meta?.whatsappPhoneNumberId,
      whatsappBusinessPhone: meta?.whatsappBusinessPhone,
      whatsappDisplayName: meta?.whatsappDisplayName,
    });

    return {
      firstname: user.firstname,
      lastname: user.lastname,
    };
  });
};

export const deleteIntegrationById = async (
  integrationId: string,
  userId: string
) => {
  const [deletedIntegration] = await db
    .delete(integrations)
    .where(and(eq(integrations.id, integrationId), eq(integrations.userId, userId)))
    .returning({
      id: integrations.id,
      userId: integrations.userId,
      name: integrations.name,
    });

  return deletedIntegration;
};
