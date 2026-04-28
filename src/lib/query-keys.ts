export const queryKeys = {
  userAutomations: () => ["user-automations"] as const,
  automation: (automationId: string) =>
    ["automation-info", automationId] as const,
  automationPosts: (channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP") =>
    ["automation-posts", channel] as const,
  automationAnalytics: (range: "7d" | "30d") =>
    ["automation-analytics", range] as const,
};
