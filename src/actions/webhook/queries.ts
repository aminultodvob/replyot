import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

import {
  AUTOMATION_EVENT_STATUS,
  AUTOMATION_EVENT_TYPE,
  AUTOMATION_CHANNEL,
  INTEGRATIONS,
  automations,
  automationEvents,
  billingUsage,
  db,
  dms,
  integrations,
  keywords,
  listeners,
  posts,
  triggers,
  users,
} from "@/db";
import type {
  AutomationChannel,
  AutomationEventStatus,
  AutomationEventType,
  BillingMetric,
} from "@/db";

export const matchKeyword = async (
  keyword: string,
  channel: AutomationChannel,
  triggerType: "COMMENT" | "DM",
  userId?: string
) => {
  const [match] = await db
    .select({
      id: keywords.id,
      word: keywords.word,
      automationId: keywords.automationId,
    })
    .from(keywords)
    .innerJoin(automations, eq(keywords.automationId, automations.id))
    .innerJoin(triggers, eq(triggers.automationId, automations.id))
    .where(
      and(
        sql`(
          lower(trim(${keywords.word})) = lower(trim(${keyword}))
          or lower(${keyword}) like ('%' || lower(trim(${keywords.word})) || '%')
        )`,
        eq(automations.channel, channel),
        eq(automations.active, true),
        eq(triggers.type, triggerType),
        userId ? eq(automations.userId, userId) : undefined
      )
    )
    .limit(1);

  return match;
};

export const getKeywordAutomation = async (
  automationId: string,
  dm: boolean,
  channel: AutomationChannel = AUTOMATION_CHANNEL.INSTAGRAM
) => {
  const integrationName =
    channel === AUTOMATION_CHANNEL.FACEBOOK_MESSENGER
      ? INTEGRATIONS.FACEBOOK_MESSENGER
      : channel === AUTOMATION_CHANNEL.WHATSAPP
        ? INTEGRATIONS.WHATSAPP
        : INTEGRATIONS.INSTAGRAM;

  return await db.query.automations.findFirst({
    where: eq(automations.id, automationId),
    with: {
      ...(dm
        ? {
            dms: true,
          }
        : {}),
      trigger: {
        where: eq(triggers.type, dm ? "DM" : "COMMENT"),
      },
      listener: true,
      User: {
        columns: {
          id: true,
        },
        with: {
          subscription: {
            columns: {
              id: true,
              plan: true,
              status: true,
              billingPeriodStart: true,
              billingPeriodEnd: true,
              updatedAt: true,
              provider: true,
            },
          },
          integrations: {
            where: eq(integrations.name, integrationName),
            columns: {
              token: true,
              instagramId: true,
              facebookPageId: true,
              pageName: true,
              whatsappBusinessAccountId: true,
              whatsappPhoneNumberId: true,
              whatsappBusinessPhone: true,
              whatsappDisplayName: true,
              name: true,
            },
          },
        },
      },
    },
  });
};

export const getCurrentBillingUsage = async (
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

export const incrementBillingUsage = async (
  userId: string,
  subscriptionId: string | null,
  periodStart: Date,
  periodEnd: Date,
  metric: BillingMetric
) => {
  const [usage] = await db
    .insert(billingUsage)
    .values({
      userId,
      subscriptionId,
      periodStart,
      periodEnd,
    })
    .onConflictDoUpdate({
      target: [billingUsage.userId, billingUsage.periodStart, billingUsage.periodEnd],
      set: {
        updatedAt: new Date(),
        subscriptionId,
        [metric]: sql`${billingUsage[metric]} + 1`,
      },
    })
    .returning();

  return usage;
};

export const getKeywordPost = async (postId: string, automationId: string) => {
  return await db.query.posts.findFirst({
    where: and(eq(posts.postid, postId), eq(posts.automationId, automationId)),
    columns: {
      id: true,
      automationId: true,
    },
  });
};

export const getFacebookPageIntegration = async (pageId: string) => {
  return await db.query.integrations.findFirst({
    where: and(
      eq(integrations.name, INTEGRATIONS.FACEBOOK_MESSENGER),
      eq(integrations.facebookPageId, pageId)
    ),
    columns: {
      token: true,
      facebookPageId: true,
      pageName: true,
      userId: true,
    },
  });
};

export const getInstagramAccountIntegration = async (instagramAccountId: string) => {
  return await db.query.integrations.findFirst({
    where: and(
      eq(integrations.name, INTEGRATIONS.INSTAGRAM),
      eq(integrations.instagramId, instagramAccountId)
    ),
    columns: {
      token: true,
      instagramId: true,
      userId: true,
    },
  });
};

export const getWhatsAppPhoneIntegration = async (phoneNumberId: string) => {
  return await db.query.integrations.findFirst({
    where: and(
      eq(integrations.name, INTEGRATIONS.WHATSAPP),
      eq(integrations.whatsappPhoneNumberId, phoneNumberId)
    ),
    columns: {
      token: true,
      whatsappBusinessAccountId: true,
      whatsappPhoneNumberId: true,
      whatsappBusinessPhone: true,
      whatsappDisplayName: true,
      userId: true,
    },
  });
};

export const logAutomationEvent = async (event: {
  userId: string;
  automationId?: string | null;
  channel: AutomationChannel;
  triggerType?: "COMMENT" | "DM" | null;
  eventType: AutomationEventType;
  senderId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  status?: AutomationEventStatus;
  reason?: string | null;
}) => {
  return await db.insert(automationEvents).values({
    userId: event.userId,
    automationId: event.automationId ?? null,
    channel: event.channel,
    triggerType: event.triggerType ?? null,
    eventType: event.eventType,
    senderId: event.senderId ?? null,
    postId: event.postId ?? null,
    commentId: event.commentId ?? null,
    status: event.status ?? AUTOMATION_EVENT_STATUS.INFO,
    reason: event.reason ?? null,
  });
};

export const trackResponses = async (
  automationId: string,
  type: "COMMENT" | "DM"
) => {
  const [listener] = await db
    .update(listeners)
    .set(
      type === "COMMENT"
        ? {
            commentCount: sql`${listeners.commentCount} + 1`,
          }
        : {
            dmCount: sql`${listeners.dmCount} + 1`,
          }
    )
    .where(eq(listeners.automationId, automationId))
    .returning();

  return listener;
};

export type AnalyticsRange = "7d" | "30d";

export type AutomationAnalytics = {
  range: AnalyticsRange;
  totals: {
    commentsReceived: number;
    repliesSent: number;
    messagesSent: number;
    uniqueUsers: number;
    successfulDeliveries: number;
  };
  trends: {
    date: string;
    label: string;
    commentsReceived: number;
    repliesSent: number;
    messagesSent: number;
    successfulDeliveries: number;
  }[];
  channelSplit: {
    channel: AutomationChannel;
    deliveries: number;
  }[];
  topAutomations: {
    automationId: string;
    name: string;
    deliveries: number;
  }[];
};

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const toLabel = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const getAutomationAnalyticsForUser = async (
  userId: string,
  range: AnalyticsRange = "7d"
): Promise<AutomationAnalytics | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
    },
  });

  if (!user) {
    return null;
  }

  const days = range === "30d" ? 30 : 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const events = await db.query.automationEvents.findMany({
    where: and(
      eq(automationEvents.userId, user.id),
      gte(automationEvents.createdAt, start)
    ),
    with: {
      Automation: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [desc(automationEvents.createdAt)],
  });

  const trendsMap = new Map<
    string,
    {
      date: string;
      label: string;
      commentsReceived: number;
      repliesSent: number;
      messagesSent: number;
      successfulDeliveries: number;
    }
  >();

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    trendsMap.set(key, {
      date: key,
      label: toLabel(date),
      commentsReceived: 0,
      repliesSent: 0,
      messagesSent: 0,
      successfulDeliveries: 0,
    });
  }

  const uniqueUsers = new Set<string>();
  const channelDeliveries: Record<AutomationChannel, number> = {
    INSTAGRAM: 0,
    FACEBOOK_MESSENGER: 0,
    WHATSAPP: 0,
  };
  const automationDeliveries = new Map<string, { name: string; deliveries: number }>();

  let commentsReceived = 0;
  let repliesSent = 0;
  let messagesSent = 0;
  let successfulDeliveries = 0;

  for (const event of events) {
    const dayKey = toDateKey(event.createdAt);
    const bucket = trendsMap.get(dayKey);

    if (
      (event.eventType === AUTOMATION_EVENT_TYPE.COMMENT_RECEIVED ||
        event.eventType === AUTOMATION_EVENT_TYPE.DM_RECEIVED) &&
      event.senderId
    ) {
      uniqueUsers.add(event.senderId);
    }

    if (event.eventType === AUTOMATION_EVENT_TYPE.COMMENT_RECEIVED) {
      commentsReceived += 1;
      if (bucket) bucket.commentsReceived += 1;
    }

    if (event.eventType === AUTOMATION_EVENT_TYPE.COMMENT_REPLY_SENT) {
      repliesSent += 1;
      if (bucket) bucket.repliesSent += 1;
      if (event.status === AUTOMATION_EVENT_STATUS.SUCCESS) {
        successfulDeliveries += 1;
        if (bucket) bucket.successfulDeliveries += 1;
        channelDeliveries[event.channel] += 1;
      }
    }

    if (event.eventType === AUTOMATION_EVENT_TYPE.DM_REPLY_SENT) {
      messagesSent += 1;
      if (bucket) bucket.messagesSent += 1;
      if (event.status === AUTOMATION_EVENT_STATUS.SUCCESS) {
        successfulDeliveries += 1;
        if (bucket) bucket.successfulDeliveries += 1;
        channelDeliveries[event.channel] += 1;
      }
    }

    if (
      event.status === AUTOMATION_EVENT_STATUS.SUCCESS &&
      (event.eventType === AUTOMATION_EVENT_TYPE.COMMENT_REPLY_SENT ||
        event.eventType === AUTOMATION_EVENT_TYPE.DM_REPLY_SENT) &&
      event.automationId
    ) {
      const current = automationDeliveries.get(event.automationId) ?? {
        name: event.Automation?.name ?? "Untitled automation",
        deliveries: 0,
      };
      current.deliveries += 1;
      automationDeliveries.set(event.automationId, current);
    }
  }

  const topAutomations = Array.from(automationDeliveries.entries())
    .map(([automationId, value]) => ({
      automationId,
      name: value.name,
      deliveries: value.deliveries,
    }))
    .sort((a, b) => b.deliveries - a.deliveries)
    .slice(0, 5);

  return {
    range,
    totals: {
      commentsReceived,
      repliesSent,
      messagesSent,
      uniqueUsers: uniqueUsers.size,
      successfulDeliveries,
    },
    trends: Array.from(trendsMap.values()),
    channelSplit: [
      {
        channel: AUTOMATION_CHANNEL.INSTAGRAM,
        deliveries: channelDeliveries.INSTAGRAM,
      },
      {
        channel: AUTOMATION_CHANNEL.FACEBOOK_MESSENGER,
        deliveries: channelDeliveries.FACEBOOK_MESSENGER,
      },
      {
        channel: AUTOMATION_CHANNEL.WHATSAPP,
        deliveries: channelDeliveries.WHATSAPP,
      },
    ],
    topAutomations,
  };
};

export const getRecentAutomationEventsForUser = async (
  userId: string,
  limit = 8
) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
    },
  });

  if (!user) {
    return [];
  }

  const events = await db.query.automationEvents.findMany({
    where: eq(automationEvents.userId, user.id),
    with: {
      Automation: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [desc(automationEvents.createdAt)],
    limit,
  });

  return events;
};

type ChatHistoryExecutor = Pick<typeof db, "insert">;

export const createChatHistory = (
  executor: ChatHistoryExecutor,
  automationId: string,
  sender: string,
  reciever: string,
  message: string,
  channel: AutomationChannel = AUTOMATION_CHANNEL.INSTAGRAM
) => {
  return executor.insert(dms).values({
    automationId,
    channel,
    reciever,
    senderId: sender,
    message,
  });
};

export const getChatHistory = async (
  sender: string,
  reciever: string,
  channel: AutomationChannel = AUTOMATION_CHANNEL.INSTAGRAM
) => {
  const history = await db.query.dms.findMany({
    where: and(
      eq(dms.senderId, sender),
      eq(dms.reciever, reciever),
      eq(dms.channel, channel)
    ),
    orderBy: [asc(dms.createdAt)],
  });

  const chatSession: {
    role: "assistant" | "user";
    content: string;
  }[] = history.map((chat) => ({
    role: chat.reciever ? "assistant" : "user",
    content: chat.message ?? "",
  }));

  return {
    history: chatSession,
    automationId: history[history.length - 1]?.automationId,
  };
};
