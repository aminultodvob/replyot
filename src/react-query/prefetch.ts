import { getAllAutomations, getAutomationInfo } from "@/actions/automations";
import { queryKeys } from "@/lib/query-keys";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

const prefetch = async (
  client: QueryClient,
  action: QueryFunction,
  key: readonly string[]
) => {
  return await client.prefetchQuery({
    queryKey: key,
    queryFn: action,
    staleTime: 60000,
  });
};

export const prefetchUserAutomations = async (client: QueryClient) => {
  return await prefetch(client, getAllAutomations, queryKeys.userAutomations());
};

export const prefetchUserAutomation = async (
  client: QueryClient,
  automationId: string
) => {
  return await prefetch(
    client,
    () => getAutomationInfo(automationId),
    queryKeys.automation(automationId)
  );
};
