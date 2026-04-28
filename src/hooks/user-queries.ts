import {
  getAllAutomations,
  getAutomationInfo,
  getProfilePosts,
} from "@/actions/automations";
import { getAutomationAnalytics } from "@/actions/analytics";
import { queryKeys } from "@/lib/query-keys";
import {
  AutomationAnalyticsResponse,
  AutomationDetailResponse,
  AutomationListResponse,
} from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";

const STALE_TIME = {
  automations: 2 * 60_000,
  automation: 2 * 60_000,
  instagramMedia: 60_000,
  analytics: 60_000,
} as const;

export const useQueryAutomations = (initialData?: AutomationListResponse) => {
  return useQuery({
    queryKey: queryKeys.userAutomations(),
    queryFn: getAllAutomations,
    initialData,
    staleTime: STALE_TIME.automations,
  });
};

export const useQueryAutomation = (
  id: string,
  initialData?: AutomationDetailResponse
) => {
  return useQuery({
    queryKey: queryKeys.automation(id),
    queryFn: () => getAutomationInfo(id),
    initialData,
    staleTime: STALE_TIME.automation,
  });
};

export const useQueryAutomationPosts = (
  enabled = false,
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP" = "INSTAGRAM"
) => {
  const fetchPosts = async () => await getProfilePosts(channel);
  return useQuery({
    queryKey: queryKeys.automationPosts(channel),
    queryFn: fetchPosts,
    enabled,
    staleTime: STALE_TIME.instagramMedia,
  });
};

export const useQueryAutomationAnalytics = (
  range: "7d" | "30d",
  initialData?: AutomationAnalyticsResponse
) => {
  return useQuery({
    queryKey: queryKeys.automationAnalytics(range),
    queryFn: () => getAutomationAnalytics(range),
    initialData,
    staleTime: STALE_TIME.analytics,
  });
};
