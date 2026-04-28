"use server";

import { unstable_cache } from "next/cache";
import { onCurrentUser } from "../user";
import {
  createAutomation,
  deleteAutomationQuery,
  findAutomationForDashboardForUser,
  findAutomationForUser,
  findAutomationOwnership,
  getAutomations,
  updateAutomationForUser,
  addListener,
  addTrigger,
  addKeyword,
  deleteKeywordForUser,
  addPost,
} from "./queries";

import type { AutomationChannel, MediaType } from "@/db";
import {
  INSTAGRAM_GRAPH_API_VERSION,
  getFacebookPagePosts,
} from "@/lib/fetch";
import { findCurrentBillingUsageByUserId, findUser } from "../user/queries";
import {
  cacheTags,
  revalidateAutomation,
  revalidateUserAutomations,
} from "@/lib/cache-tags";
import { timeServerStep } from "@/lib/dev-timing";
import axios from "axios";
import { ensurePackageMutationAccess } from "@/lib/billing-access";
import { getCurrentBillingPeriodBounds, getPlanCapabilities } from "@/lib/billing";
import { resolveOwnershipStatus } from "@/lib/authz";

const getPackageMutationContext = async (userId: string) => {
  const profile = await findUser(userId);

  if (!profile?.id) {
    return {
      ok: false as const,
      status: 404 as const,
      data: "User not found",
    };
  }

  const bounds = getCurrentBillingPeriodBounds(profile.subscription);
  const usage = bounds
    ? await findCurrentBillingUsageByUserId(
        profile.id,
        bounds.periodStart,
        bounds.periodEnd
      )
    : null;

  const access = ensurePackageMutationAccess(profile.subscription, usage);
  if (!access.ok) {
    return {
      ok: false as const,
      status: 402 as const,
      data: access.message,
    };
  }

  return {
    ok: true as const,
    profile,
    usage,
  };
};

const getCachedAutomations = (userId: string) =>
  unstable_cache(
    async () =>
      timeServerStep(`getAutomations:${userId}`, () => getAutomations(userId)),
    ["user-automations", userId],
    {
      tags: [cacheTags.userAutomations(userId)],
      revalidate: 30,
    }
  )();

const getCachedAutomationInfo = (automationId: string, userId: string) =>
  unstable_cache(
    async () =>
      timeServerStep(`findAutomation:${automationId}`, () =>
        findAutomationForDashboardForUser(userId, automationId)
      ),
    ["automation-info", automationId, userId],
    {
      tags: [cacheTags.automation(automationId)],
      revalidate: 30,
    }
  )();

const requireOwnedAutomation = async (userId: string, automationId: string) => {
  const ownership = await findAutomationOwnership(automationId);
  const ownershipStatus = resolveOwnershipStatus(ownership, userId);

  if (!ownershipStatus.ok) {
    return {
      ok: false as const,
      status: ownershipStatus.status,
      data:
        ownershipStatus.status === 403
          ? "You do not have access to this automation"
          : "Automation not found",
    };
  }

  const automation = await findAutomationForUser(userId, automationId);
  if (!automation) {
    return {
      ok: false as const,
      status: 404 as const,
      data: "Automation not found",
    };
  }

  return {
    ok: true as const,
    automation,
  };
};

export const createAutomations = async (id?: string) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const capabilities = getPlanCapabilities(access.profile.subscription?.plan ?? "FREE");
    const existingAutomations = await getAutomations(user.id);
    const totalAutomations = existingAutomations?.automations.length ?? 0;

    if (capabilities.plan === "FREE" && totalAutomations >= capabilities.maxAutomations) {
      return {
        status: 403,
        data: `Free includes ${capabilities.maxAutomations} automation. Upgrade to Pro to create more.`,
      };
    }

    const create = await createAutomation(user.id, id);
    if (create) {
      revalidateUserAutomations(user.id);
      return {
        status: 200,
        data: "Automation Created",
      };
    }
  } catch (error) {
    return { status: 500, data: "Internal Server Error" };
  }
};

export const getAllAutomations = async () => {
  const user = await onCurrentUser();
  try {
    const automations = await getCachedAutomations(user.id);

    if (automations) return { status: 200, data: automations.automations };

    return { status: 404, data: [] };
  } catch (error) {
    return { status: 500, data: [] };
  }
};

export const getAutomationInfo = async (id: string) => {
  const user = await onCurrentUser();
  try {
    const owned = await requireOwnedAutomation(user.id, id);
    if (!owned.ok) {
      return { status: owned.status };
    }

    const automation = await getCachedAutomationInfo(id, user.id);
    if (automation) return { status: 200, data: automation };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
    channel?: AutomationChannel;
  }
) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, automationId);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }

    const update = await updateAutomationForUser(user.id, automationId, data);
    if (update) {
      revalidateAutomation(automationId);
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Automation successfully updated" };
    }
    return { status: 404, data: "Oops! could not find automation" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const updateAutomationChannel = async (
  automationId: string,
  channel: AutomationChannel
) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, automationId);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }

    const update = await updateAutomationForUser(user.id, automationId, {
      channel,
    });
    if (update) {
      revalidateAutomation(automationId);
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Automation channel updated" };
    }
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const activateAutomation = async (id: string, state: boolean) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, id);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }
    const automation = owned.automation;

    if (state) {
      const hasRequiredIntegration = automation.User?.integrations?.some(
        (integration) =>
          integration.name === automation.channel &&
          Boolean(integration.token) &&
          (automation.channel === "INSTAGRAM"
            ? true
            : automation.channel === "FACEBOOK_MESSENGER"
              ? Boolean(integration.facebookPageId)
              : Boolean(integration.whatsappPhoneNumberId))
      );
      const hasCommentTrigger = automation.trigger.some(
        (trigger) => trigger.type === "COMMENT"
      );
      const missingPostsForComments =
        hasCommentTrigger && automation.posts.length === 0;
      const missingListener = !automation.listener;
      const missingKeywords = automation.keywords.length === 0;

      if (missingListener) {
        return {
          status: 400,
          data: "Add a listener before activating this automation",
        };
      }

      if (!hasRequiredIntegration) {
        return {
          status: 400,
          data:
            automation.channel === "FACEBOOK_MESSENGER"
              ? "Connect a Facebook Page in Integrations before activating this automation"
              : automation.channel === "WHATSAPP"
                ? "Connect WhatsApp Business in Integrations before activating this automation"
                : "Connect Instagram in Integrations before activating this automation",
        };
      }

      if (missingKeywords) {
        return {
          status: 400,
          data: "Add at least one keyword before activating this automation",
        };
      }

      if (missingPostsForComments) {
        return {
          status: 400,
          data: "Attach at least one selected post before activating comment automations",
        };
      }
    }

    const update = await updateAutomationForUser(user.id, id, { active: state });
    if (update) {
      revalidateAutomation(id);
      revalidateUserAutomations(user.id);
      return {
        status: 200,
        data: `Automation ${state ? "activated" : "disabled"}`,
      };
    }
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveListener = async (
  automationId: string,
  listener: "MESSAGE",
  prompt: string,
  reply?: string
) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, automationId);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }
    const automation = owned.automation;

    if (
      automation.channel === "FACEBOOK_MESSENGER" &&
      (!reply || !reply.trim())
    ) {
      return {
        status: 400,
        data: "Add a public comment reply for Facebook comment automations",
      };
    }

    const create = await addListener(automationId, listener, prompt, reply);
    if (create) {
      revalidateAutomation(automationId);
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Listener saved" };
    }
    return { status: 404, data: "Oops! could not save listener" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, automationId);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }
    const automation = owned.automation;

    if (
      automation.channel === "FACEBOOK_MESSENGER" &&
      trigger.some((type) => type === "DM")
    ) {
      return {
        status: 400,
        data: "Facebook automations only support comment triggers",
      };
    }

    if (
      automation.channel === "WHATSAPP" &&
      trigger.some((type) => type !== "DM")
    ) {
      return {
        status: 400,
        data: "WhatsApp automations only support DM triggers",
      };
    }

    const create = await addTrigger(automationId, trigger);
    if (create) {
      revalidateAutomation(automationId);
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Trigger saved" };
    }
    return { status: 404, data: "Oops! could not save trigger" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};
export const saveKeyword = async (automationId: string, keyword: string) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, automationId);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }

    const create = await addKeyword(automationId, keyword);
    if (create) {
      revalidateAutomation(automationId);
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Keyword saved" };
    }
    return { status: 404, data: "Oops! could not save keywords" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteKeyword = async (id: string) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const deleted = await deleteKeywordForUser(user.id, id);
    if (deleted) {
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Keyword deleted" };
    }
    return { status: 404, data: "Oops! could not delete keyword" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

const IG_MEDIA_PATH = `${INSTAGRAM_GRAPH_API_VERSION}/me/media`;

const getCachedProfilePosts = unstable_cache(
  async (token: string) => {
    const url = `${process.env.INSTAGRAM_BASE_URL}/${IG_MEDIA_PATH}?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${encodeURIComponent(token)}`;
    const posts = await fetch(url, {
      next: { revalidate: 60 },
    });

    let parsed: unknown;
    try {
      parsed = await posts.json();
    } catch {
      return { status: 502, data: { message: "Invalid response from Instagram." } };
    }

    if (parsed && typeof parsed === "object" && "error" in parsed) {
      const err = (parsed as {
        error: { code?: number; message?: string; type?: string };
      }).error;
      return {
        status: 401,
        data: {
          code: err.code,
          message: err.message ?? "Instagram rejected the access token.",
          type: err.type,
          needsReconnect: err.code === 190,
        },
      };
    }

    if (!posts.ok) {
      return {
        status: posts.status >= 400 && posts.status < 600 ? posts.status : 502,
        data: { message: "Could not load posts from Instagram." },
      };
    }

    const body = parsed as { data?: unknown };
    if (!Array.isArray(body.data)) {
      return { status: 502, data: { message: "Unexpected response from Instagram." } };
    }

    return { status: 200, data: parsed as { data: unknown[]; paging?: unknown } };
  },
  ["instagram-profile-posts"],
  { revalidate: 60 }
);

export const getProfilePosts = async (
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP" = "INSTAGRAM"
) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const profile = await findUser(user.id);
    const integration = profile?.integrations?.find(
      (item) => item.name === channel
    );

    const token = integration?.token;

    if (!token) {
      return {
        status: 404,
        data: {
          message:
            channel === "FACEBOOK_MESSENGER"
              ? "Connect Facebook Page in Integrations to load posts."
              : channel === "WHATSAPP"
                ? "WhatsApp automations do not use posts."
              : "Connect Instagram in Integrations to load posts.",
        },
      };
    }

    if (channel === "WHATSAPP") {
      return {
        status: 400,
        data: {
          message: "WhatsApp automations do not support post targeting.",
        },
      };
    }

    if (channel === "FACEBOOK_MESSENGER") {
      if (!integration?.facebookPageId) {
        return {
          status: 404,
          data: {
            message:
              "Select a Facebook Page in Integrations to load available posts.",
          },
        };
      }

      const facebookPosts = await getFacebookPagePosts(
        integration.facebookPageId,
        token
      );

      const mappedPosts = facebookPosts.map((post) => {
        const attachmentImage =
          post.attachments?.data?.[0]?.media?.image?.src ??
          post.attachments?.data?.[0]?.subattachments?.data?.[0]?.media?.image
            ?.src ??
          "";

        const mediaUrl = post.full_picture ?? attachmentImage ?? "";

        return {
          id: post.id,
          caption: post.message ?? "",
          media_url: mediaUrl,
          media_type: "IMAGE" as const,
          timestamp: post.created_time ?? new Date().toISOString(),
        };
      });

      return { status: 200, data: { data: mappedPosts } };
    }

    return await getCachedProfilePosts(token);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const graphError = error.response?.data?.error as
        | { code?: number; message?: string; type?: string }
        | undefined;

      if (graphError) {
        return {
          status: graphError.code === 190 ? 401 : error.response?.status ?? 500,
          data: {
            message: graphError.message ?? "Could not load posts from Graph API.",
            type: graphError.type,
            code: graphError.code,
            needsReconnect: graphError.code === 190,
          },
        };
      }
    }

    console.log(" server side Error in getting posts ", error);
    return { status: 500, data: { message: "Something went wrong loading posts." } };
  }
};

export const savePosts = async (
  autmationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: MediaType;
  }[]
) => {
  const user = await onCurrentUser();
  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const owned = await requireOwnedAutomation(user.id, autmationId);
    if (!owned.ok) {
      return { status: owned.status, data: owned.data };
    }

    const create = await addPost(autmationId, posts);

    if (create) {
      revalidateAutomation(autmationId);
      revalidateUserAutomations(user.id);
      return { status: 200, data: "Posts attached" };
    }

    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteAutomation = async (automationId: string) => {
  const user = await onCurrentUser();

  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return access;
    }

    const profile = await findUser(user.id);
    if (!profile?.id) {
      return { status: 404, data: "User not found" };
    }

    const deleted = await deleteAutomationQuery(automationId, profile.id);
    if (!deleted) {
      return { status: 404, data: "Automation not found" };
    }

    revalidateAutomation(automationId);
    revalidateUserAutomations(user.id);

    return { status: 200, data: "Automation deleted" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};
