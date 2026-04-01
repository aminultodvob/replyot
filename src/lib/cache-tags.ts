import { revalidateTag } from "next/cache";

export const cacheTags = {
  userProfile: (userId: string) => `user-profile:${userId}`,
  userAutomations: (userId: string) => `user-automations:${userId}`,
  automation: (automationId: string) => `automation:${automationId}`,
};

export const revalidateUserProfile = (userId: string) => {
  revalidateTag(cacheTags.userProfile(userId));
};

export const revalidateUserAutomations = (userId: string) => {
  revalidateTag(cacheTags.userAutomations(userId));
};

export const revalidateAutomation = (automationId: string) => {
  revalidateTag(cacheTags.automation(automationId));
};
