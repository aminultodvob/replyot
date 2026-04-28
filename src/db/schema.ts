import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const enumObject = <const T extends readonly string[]>(values: T) =>
  Object.freeze(
    Object.fromEntries(values.map((value) => [value, value])) as {
      [K in T[number]]: K;
    }
  );

export const subscriptionPlanEnum = pgEnum("SUBSCRIPTION_PLAN", ["PRO", "FREE"]);
export const paymentProviderEnum = pgEnum("PAYMENT_PROVIDER", ["UDDOKTAPAY"]);
export const paymentHistoryStatusEnum = pgEnum("PAYMENT_HISTORY_STATUS", [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELED",
  "REFUNDED",
]);
export const subscriptionStatusEnum = pgEnum("SUBSCRIPTION_STATUS", [
  "INACTIVE",
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELED",
  "FAILED",
]);
export const integrationEnum = pgEnum("INTEGRATIONS", [
  "INSTAGRAM",
  "FACEBOOK_MESSENGER",
  "WHATSAPP",
]);
export const automationChannelEnum = pgEnum("AUTOMATION_CHANNEL", [
  "INSTAGRAM",
  "FACEBOOK_MESSENGER",
  "WHATSAPP",
]);
export const mediaTypeEnum = pgEnum("MEDIATYPE", [
  "IMAGE",
  "VIDEO",
  "CAROSEL_ALBUM",
]);
export const listenerEnum = pgEnum("LISTENERS", ["SMARTAI", "MESSAGE"]);

export const SUBSCRIPTION_PLAN = enumObject(subscriptionPlanEnum.enumValues);
export const PAYMENT_PROVIDER = enumObject(paymentProviderEnum.enumValues);
export const PAYMENT_HISTORY_STATUS = enumObject(
  paymentHistoryStatusEnum.enumValues
);
export const SUBSCRIPTION_STATUS = enumObject(subscriptionStatusEnum.enumValues);
export const INTEGRATIONS = enumObject(integrationEnum.enumValues);
export const AUTOMATION_CHANNEL = enumObject(automationChannelEnum.enumValues);
export const MEDIATYPE = enumObject(mediaTypeEnum.enumValues);
export const LISTENERS = enumObject(listenerEnum.enumValues);

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLAN;
export type PaymentProvider = keyof typeof PAYMENT_PROVIDER;
export type PaymentHistoryStatus = keyof typeof PAYMENT_HISTORY_STATUS;
export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUS;
export type IntegrationName = keyof typeof INTEGRATIONS;
export type AutomationChannel = keyof typeof AUTOMATION_CHANNEL;
export type MediaType = keyof typeof MEDIATYPE;
export type ListenerType = keyof typeof LISTENERS;

export const AUTOMATION_EVENT_TYPE = Object.freeze({
  COMMENT_RECEIVED: "COMMENT_RECEIVED",
  DM_RECEIVED: "DM_RECEIVED",
  KEYWORD_MATCHED: "KEYWORD_MATCHED",
  COMMENT_REPLY_SENT: "COMMENT_REPLY_SENT",
  DM_REPLY_SENT: "DM_REPLY_SENT",
  IGNORED: "IGNORED",
  DELIVERY_FAILED: "DELIVERY_FAILED",
} as const);

export const AUTOMATION_EVENT_STATUS = Object.freeze({
  SUCCESS: "SUCCESS",
  INFO: "INFO",
  ERROR: "ERROR",
} as const);

export type AutomationEventType = keyof typeof AUTOMATION_EVENT_TYPE;
export type AutomationEventStatus = keyof typeof AUTOMATION_EVENT_STATUS;
export type BillingMetric =
  | "facebookCommentReplies"
  | "instagramDmReplies"
  | "instagramCommentReplies"
  | "whatsappMessagesSent";

export const users = pgTable(
  "User",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    passwordHash: text("passwordHash").notNull(),
    firstname: text("firstname"),
    lastname: text("lastname"),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailKey: uniqueIndex("User_email_key").on(table.email),
  })
);

export const subscriptions = pgTable(
  "Subscription",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    plan: subscriptionPlanEnum("plan").notNull().default("FREE"),
    provider: paymentProviderEnum("provider"),
    status: subscriptionStatusEnum("status").notNull().default("INACTIVE"),
    updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    billingPeriodStart: timestamp("billingPeriodStart", {
      mode: "date",
      precision: 3,
    }),
    billingPeriodEnd: timestamp("billingPeriodEnd", {
      mode: "date",
      precision: 3,
    }),
    lastPaymentAt: timestamp("lastPaymentAt", {
      mode: "date",
      precision: 3,
    }),
    externalPaymentId: text("externalPaymentId"),
    invoiceId: text("invoiceId"),
    renewalReminderSentAt: timestamp("renewalReminderSentAt", {
      mode: "date",
      precision: 3,
    }),
  },
  (table) => ({
    userIdKey: uniqueIndex("Subscription_userId_key").on(table.userId),
    invoiceIdKey: uniqueIndex("Subscription_invoiceId_key").on(table.invoiceId),
  })
);

export const integrations = pgTable(
  "Integrations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: integrationEnum("name").notNull().default("INSTAGRAM"),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    userId: uuid("userId").references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    token: text("token").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }),
    instagramId: text("instagramId"),
    facebookPageId: text("facebookPageId"),
    pageName: text("pageName"),
    whatsappBusinessAccountId: text("whatsappBusinessAccountId"),
    whatsappPhoneNumberId: text("whatsappPhoneNumberId"),
    whatsappBusinessPhone: text("whatsappBusinessPhone"),
    whatsappDisplayName: text("whatsappDisplayName"),
  },
  (table) => ({
    tokenKey: uniqueIndex("Integrations_token_key").on(table.token),
    instagramIdKey: uniqueIndex("Integrations_instagramId_key").on(
      table.instagramId
    ),
    facebookPageIdKey: uniqueIndex("Integrations_facebookPageId_key").on(
      table.facebookPageId
    ),
    whatsappPhoneNumberIdKey: uniqueIndex("Integrations_whatsappPhoneNumberId_key").on(
      table.whatsappPhoneNumberId
    ),
  })
);

export const billingUsage = pgTable(
  "BillingUsage",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subscriptionId: uuid("subscriptionId").references(() => subscriptions.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    periodStart: timestamp("periodStart", { mode: "date", precision: 3 })
      .notNull(),
    periodEnd: timestamp("periodEnd", { mode: "date", precision: 3 }).notNull(),
    facebookCommentReplies: integer("facebookCommentReplies")
      .notNull()
      .default(0),
    instagramDmReplies: integer("instagramDmReplies").notNull().default(0),
    instagramCommentReplies: integer("instagramCommentReplies")
      .notNull()
      .default(0),
    whatsappMessagesSent: integer("whatsappMessagesSent").notNull().default(0),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userPeriodKey: uniqueIndex("BillingUsage_user_period_key").on(
      table.userId,
      table.periodStart,
      table.periodEnd
    ),
    userPeriodIdx: index("BillingUsage_user_period_idx").on(
      table.userId,
      table.periodStart,
      table.periodEnd
    ),
  })
);

export const paymentHistory = pgTable(
  "PaymentHistory",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    subscriptionId: uuid("subscriptionId").references(() => subscriptions.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    provider: paymentProviderEnum("provider").notNull().default("UDDOKTAPAY"),
    invoiceId: text("invoiceId").notNull(),
    externalPaymentId: text("externalPaymentId"),
    plan: subscriptionPlanEnum("plan").notNull().default("PRO"),
    amount: text("amount").notNull(),
    currency: text("currency").notNull(),
    status: paymentHistoryStatusEnum("status").notNull().default("PENDING"),
    billingPeriodStart: timestamp("billingPeriodStart", {
      mode: "date",
      precision: 3,
    }),
    billingPeriodEnd: timestamp("billingPeriodEnd", {
      mode: "date",
      precision: 3,
    }),
    paidAt: timestamp("paidAt", {
      mode: "date",
      precision: 3,
    }),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoiceIdKey: uniqueIndex("PaymentHistory_invoiceId_key").on(table.invoiceId),
    userCreatedIdx: index("PaymentHistory_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export const passwordResetTokens = pgTable(
  "PasswordResetToken",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tokenHash: text("tokenHash").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }).notNull(),
    usedAt: timestamp("usedAt", { mode: "date", precision: 3 }),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenHashKey: uniqueIndex("PasswordResetToken_tokenHash_key").on(table.tokenHash),
    userIdIdx: index("PasswordResetToken_userId_idx").on(table.userId),
  })
);

export const processedExternalEvents = pgTable(
  "ProcessedExternalEvent",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    provider: text("provider").notNull(),
    eventKey: text("eventKey").notNull(),
    status: text("status").notNull().default("SUCCESS"),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processedAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    providerEventKey: uniqueIndex("ProcessedExternalEvent_provider_event_key").on(
      table.provider,
      table.eventKey
    ),
    providerCreatedIdx: index("ProcessedExternalEvent_provider_created_idx").on(
      table.provider,
      table.createdAt
    ),
  })
);

export const automations = pgTable("Automation", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Untitled"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  active: boolean("active").notNull().default(false),
  channel: automationChannelEnum("channel").notNull().default("INSTAGRAM"),
  userId: uuid("userId").references(() => users.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const dms = pgTable("Dms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  automationId: uuid("automationId").references(() => automations.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  channel: automationChannelEnum("channel").notNull().default("INSTAGRAM"),
  senderId: text("senderId"),
  reciever: text("reciever"),
  message: text("message"),
});

export const posts = pgTable("Post", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postid: text("postid").notNull(),
  caption: text("caption"),
  media: text("media").notNull(),
  mediaType: mediaTypeEnum("mediaType").notNull().default("IMAGE"),
  automationId: uuid("automationId").references(() => automations.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const listeners = pgTable(
  "Listener",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    automationId: uuid("automationId")
      .notNull()
      .references(() => automations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    listener: listenerEnum("listener").notNull().default("MESSAGE"),
    prompt: text("prompt").notNull(),
    commentReply: text("commentReply"),
    dmCount: integer("dmCount").notNull().default(0),
    commentCount: integer("commentCount").notNull().default(0),
  },
  (table) => ({
    automationIdKey: uniqueIndex("Listener_automationId_key").on(
      table.automationId
    ),
  })
);

export const triggers = pgTable("Trigger", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  automationId: uuid("automationId").references(() => automations.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const keywords = pgTable(
  "Keyword",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    word: text("word").notNull(),
    automationId: uuid("automationId").references(() => automations.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  },
  (table) => ({
    automationWordKey: uniqueIndex("Keyword_automationId_word_key").on(
      table.automationId,
      table.word
    ),
  })
);

export const automationEvents = pgTable(
  "AutomationEvent",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    automationId: uuid("automationId").references(() => automations.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    channel: automationChannelEnum("channel").notNull().default("INSTAGRAM"),
    triggerType: text("triggerType"),
    eventType: text("eventType").notNull(),
    senderId: text("senderId"),
    postId: text("postId"),
    commentId: text("commentId"),
    status: text("status").notNull().default("INFO"),
    reason: text("reason"),
    createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("AutomationEvent_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
    automationCreatedAtIdx: index("AutomationEvent_automation_created_idx").on(
      table.automationId,
      table.createdAt
    ),
  })
);

export const usersRelations = relations(users, ({ many, one }) => ({
  subscription: one(subscriptions),
  integrations: many(integrations),
  automations: many(automations),
  automationEvents: many(automationEvents),
  billingUsage: many(billingUsage),
  paymentHistory: many(paymentHistory),
  passwordResetTokens: many(passwordResetTokens),
}));

export const subscriptionsRelations = relations(subscriptions, ({ many, one }) => ({
  User: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  billingUsage: many(billingUsage),
  paymentHistory: many(paymentHistory),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  User: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const automationsRelations = relations(automations, ({ many, one }) => ({
  User: one(users, {
    fields: [automations.userId],
    references: [users.id],
  }),
  trigger: many(triggers),
  listener: one(listeners),
  posts: many(posts),
  dms: many(dms),
  keywords: many(keywords),
  automationEvents: many(automationEvents),
}));

export const dmsRelations = relations(dms, ({ one }) => ({
  Automation: one(automations, {
    fields: [dms.automationId],
    references: [automations.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  Automation: one(automations, {
    fields: [posts.automationId],
    references: [automations.id],
  }),
}));

export const listenersRelations = relations(listeners, ({ one }) => ({
  Automation: one(automations, {
    fields: [listeners.automationId],
    references: [automations.id],
  }),
}));

export const triggersRelations = relations(triggers, ({ one }) => ({
  Automation: one(automations, {
    fields: [triggers.automationId],
    references: [automations.id],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one }) => ({
  Automation: one(automations, {
    fields: [keywords.automationId],
    references: [automations.id],
  }),
}));

export const automationEventsRelations = relations(
  automationEvents,
  ({ one }) => ({
    User: one(users, {
      fields: [automationEvents.userId],
      references: [users.id],
    }),
    Automation: one(automations, {
      fields: [automationEvents.automationId],
      references: [automations.id],
    }),
  })
);

export const billingUsageRelations = relations(billingUsage, ({ one }) => ({
  User: one(users, {
    fields: [billingUsage.userId],
    references: [users.id],
  }),
  Subscription: one(subscriptions, {
    fields: [billingUsage.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  User: one(users, {
    fields: [paymentHistory.userId],
    references: [users.id],
  }),
  Subscription: one(subscriptions, {
    fields: [paymentHistory.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    User: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);
