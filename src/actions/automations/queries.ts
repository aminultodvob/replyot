"use server";

import { and, asc, eq, sql } from "drizzle-orm";

import { automations, db, keywords, listeners, posts, triggers, users } from "@/db";
import type { AutomationChannel, ListenerType, MediaType } from "@/db";

export const createAutomation = async (userId: string, id?: string) => {
  const [automation] = await db
    .insert(automations)
    .values({
      ...(id ? { id } : {}),
      userId,
    })
    .returning();

  return automation;
};

export const getAutomations = async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
    },
    with: {
      automations: {
        orderBy: (table, { asc }) => [asc(table.createdAt)],
        columns: {
          id: true,
          name: true,
          createdAt: true,
          active: true,
          channel: true,
        },
        with: {
          keywords: {
            columns: {
              id: true,
              word: true,
              automationId: true,
            },
          },
          listener: {
            columns: {
              id: true,
              listener: true,
              prompt: true,
              commentReply: true,
              dmCount: true,
              commentCount: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return undefined;
  }

  return {
    automations: user.automations,
  };
};

export const findAutomationForDashboard = async (id: string) => {
  return await db.query.automations.findFirst({
    where: eq(automations.id, id),
    columns: {
      id: true,
      name: true,
      createdAt: true,
      active: true,
      channel: true,
    },
    with: {
      keywords: {
        columns: {
          id: true,
          word: true,
          automationId: true,
        },
      },
      trigger: {
        columns: {
          id: true,
          type: true,
          automationId: true,
        },
      },
      posts: {
        columns: {
          id: true,
          postid: true,
          caption: true,
          media: true,
          mediaType: true,
          automationId: true,
        },
      },
      listener: {
        columns: {
          id: true,
          listener: true,
          prompt: true,
          commentReply: true,
          dmCount: true,
          commentCount: true,
          automationId: true,
        },
      },
      User: {
        columns: {},
        with: {
          subscription: {
            columns: {
              id: true,
              plan: true,
              provider: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              billingPeriodStart: true,
              billingPeriodEnd: true,
              lastPaymentAt: true,
              externalPaymentId: true,
              invoiceId: true,
              renewalReminderSentAt: true,
              userId: true,
            },
          },
          integrations: {
            columns: {
              id: true,
              name: true,
              token: true,
              expiresAt: true,
              instagramId: true,
              facebookPageId: true,
              pageName: true,
              userId: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
};

export const findAutomationOwnership = async (id: string) => {
  return await db.query.automations.findFirst({
    where: eq(automations.id, id),
    columns: {
      id: true,
      userId: true,
    },
  });
};

export const findAutomationForDashboardForUser = async (
  userId: string,
  id: string
) => {
  return await db.query.automations.findFirst({
    where: and(eq(automations.id, id), eq(automations.userId, userId)),
    columns: {
      id: true,
      name: true,
      createdAt: true,
      active: true,
      channel: true,
    },
    with: {
      keywords: {
        columns: {
          id: true,
          word: true,
          automationId: true,
        },
      },
      trigger: {
        columns: {
          id: true,
          type: true,
          automationId: true,
        },
      },
      posts: {
        columns: {
          id: true,
          postid: true,
          caption: true,
          media: true,
          mediaType: true,
          automationId: true,
        },
      },
      listener: {
        columns: {
          id: true,
          listener: true,
          prompt: true,
          commentReply: true,
          dmCount: true,
          commentCount: true,
          automationId: true,
        },
      },
      User: {
        columns: {},
        with: {
          subscription: {
            columns: {
              id: true,
              plan: true,
              provider: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              billingPeriodStart: true,
              billingPeriodEnd: true,
              lastPaymentAt: true,
              externalPaymentId: true,
              invoiceId: true,
              renewalReminderSentAt: true,
              userId: true,
            },
          },
          integrations: {
            columns: {
              id: true,
              name: true,
              token: true,
              expiresAt: true,
              instagramId: true,
              facebookPageId: true,
              pageName: true,
              userId: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
};

export const findAutomation = async (id: string) => {
  return await db.query.automations.findFirst({
    where: eq(automations.id, id),
    with: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      User: {
        columns: {},
        with: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });
};

export const findAutomationForUser = async (userId: string, id: string) => {
  return await db.query.automations.findFirst({
    where: and(eq(automations.id, id), eq(automations.userId, userId)),
    with: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      User: {
        columns: {},
        with: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });
};

export const updateAutomation = async (
  id: string,
  update: {
    name?: string;
    active?: boolean;
    channel?: AutomationChannel;
  }
) => {
  const values: {
    name?: string;
    active?: boolean;
    channel?: AutomationChannel;
  } = {};

  if (update.name !== undefined) {
    values.name = update.name;
  }

  if (update.active !== undefined) {
    values.active = update.active;
  }

  if (update.channel !== undefined) {
    values.channel = update.channel;
  }

  if (Object.keys(values).length === 0) {
    return await db.query.automations.findFirst({
      where: eq(automations.id, id),
    });
  }

  const [automation] = await db
    .update(automations)
    .set(values)
    .where(eq(automations.id, id))
    .returning();

  return automation;
};

export const updateAutomationForUser = async (
  userId: string,
  id: string,
  update: {
    name?: string;
    active?: boolean;
    channel?: AutomationChannel;
  }
) => {
  const values: {
    name?: string;
    active?: boolean;
    channel?: AutomationChannel;
  } = {};

  if (update.name !== undefined) {
    values.name = update.name;
  }

  if (update.active !== undefined) {
    values.active = update.active;
  }

  if (update.channel !== undefined) {
    values.channel = update.channel;
  }

  if (Object.keys(values).length === 0) {
    return await db.query.automations.findFirst({
      where: and(eq(automations.id, id), eq(automations.userId, userId)),
    });
  }

  const [automation] = await db
    .update(automations)
    .set(values)
    .where(and(eq(automations.id, id), eq(automations.userId, userId)))
    .returning();

  return automation;
};

export const addListener = async (
  automationId: string,
  listener: ListenerType,
  prompt: string,
  reply?: string
) => {
  const [savedListener] = await db
    .insert(listeners)
    .values({
      automationId,
      listener,
      prompt,
      commentReply: reply,
    })
    .onConflictDoUpdate({
      target: listeners.automationId,
      set: {
        listener,
        prompt,
        commentReply: reply,
      },
    })
    .returning();

  return savedListener;
};

export const addTrigger = async (automationId: string, trigger: string[]) => {
  return await db.transaction(async (tx) => {
    await tx.delete(triggers).where(eq(triggers.automationId, automationId));

    if (trigger.length === 0) {
      return [];
    }

    return await tx
      .insert(triggers)
      .values(trigger.map((type) => ({ automationId, type })))
      .returning();
  });
};

export const addKeyword = async (automationId: string, keyword: string) => {
  const [savedKeyword] = await db
    .insert(keywords)
    .values({
      automationId,
      word: keyword,
    })
    .returning();

  return savedKeyword;
};

export const deleteKeywordQuery = async (id: string) => {
  const [deletedKeyword] = await db
    .delete(keywords)
    .where(eq(keywords.id, id))
    .returning();

  return deletedKeyword;
};

export const deleteKeywordForUser = async (userId: string, id: string) => {
  const [deletedKeyword] = await db
    .delete(keywords)
    .where(
      and(
        eq(keywords.id, id),
        sql`exists (
          select 1 from "Automation"
          where "Automation"."id" = ${keywords.automationId}
          and "Automation"."userId" = ${userId}
        )`
      )
    )
    .returning();

  return deletedKeyword;
};

export const addPost = async (
  automationId: string,
  nextPosts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: MediaType;
  }[]
) => {
  return await db.transaction(async (tx) => {
    await tx.delete(posts).where(eq(posts.automationId, automationId));

    if (nextPosts.length === 0) {
      return [];
    }

    return await tx
      .insert(posts)
      .values(
        nextPosts.map((post) => ({
          automationId,
          ...post,
        }))
      )
      .returning();
  });
};

export const deleteAutomationQuery = async (
  automationId: string,
  userId: string
) => {
  const [deletedAutomation] = await db
    .delete(automations)
    .where(and(eq(automations.id, automationId), eq(automations.userId, userId)))
    .returning({
      id: automations.id,
      userId: automations.userId,
    });

  return deletedAutomation;
};
