"use server";

import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import {
  createIntegration,
  deleteIntegrationById,
  findIntegrationByFacebookPageId,
  findIntegrationByInstagramId,
  findIntegrationByWhatsAppPhoneNumberId,
  getIntegration,
  updateIntegration,
} from "./queries";
import { findCurrentBillingUsageByUserId, findUser } from "../user/queries";
import {
  buildFacebookAuthorizeUrl,
  buildInstagramAuthorizeUrl,
  generateFacebookUserToken,
  generateTokens,
  getFacebookPages,
  getWhatsAppPhoneNumberDetails,
  getWhatsAppSystemUserToken,
  INSTAGRAM_GRAPH_API_VERSION,
  subscribeAppToWhatsAppBusinessAccount,
} from "@/lib/fetch";
import axios from "axios";
import { revalidateUserProfile } from "@/lib/cache-tags";
import {
  createPendingFacebookSelection,
  decodePendingFacebookSelection,
} from "@/lib/facebook-page-selection";
import { ensurePackageMutationAccess } from "@/lib/billing-access";
import {
  getCurrentBillingPeriodBounds,
  getPlanCapabilities,
} from "@/lib/billing";

const getShortUserId = (userId: string) => userId.slice(0, 8);

const getErrorSummary = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return {
      type: "axios",
      message: error.message,
      status: error.response?.status ?? null,
      metaCode:
        error.response?.data?.error?.code ??
        error.response?.data?.error_code ??
        null,
      metaType: error.response?.data?.error?.type ?? null,
      metaMessage:
        error.response?.data?.error?.message ??
        error.response?.data?.message ??
        null,
    };
  }

  if (error instanceof Error) {
    return {
      type: "error",
      message: error.message,
      causeCode:
        typeof (error as { cause?: { code?: string } }).cause?.code === "string"
          ? (error as { cause?: { code?: string } }).cause?.code
          : null,
    };
  }

  return {
    type: typeof error,
    message: "unknown",
  };
};

const logFacebookIntegration = (
  event: string,
  payload: Record<string, unknown>
) => {
  console.info(`[developer:facebook] ${event}`, payload);
};

const isUniqueConstraintError = (
  error: unknown,
  constraintName: string
) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    cause?: {
      code?: string;
      constraint_name?: string;
    };
  };

  return (
    maybeError.cause?.code === "23505" &&
    maybeError.cause?.constraint_name === constraintName
  );
};

const FACEBOOK_TOKEN_FALLBACK_DAYS = 60;

const resolveTokenExpiry = (
  value: number | string | null | undefined,
  fallbackDays: number = FACEBOOK_TOKEN_FALLBACK_DAYS
) => {
  const seconds =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  if (Number.isFinite(seconds) && seconds > 0) {
    return {
      expiresAt: new Date(Date.now() + seconds * 1000),
      usedFallback: false,
    };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + fallbackDays);

  return {
    expiresAt,
    usedFallback: true,
  };
};

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
  };
};

const getConnectedChannelCount = (
  profile: NonNullable<Awaited<ReturnType<typeof findUser>>>
) =>
  profile.integrations.filter((integration) =>
    integration.name === "FACEBOOK_MESSENGER"
      ? Boolean(integration.token && integration.facebookPageId)
      : integration.name === "WHATSAPP"
        ? Boolean(integration.token && integration.whatsappPhoneNumberId)
      : Boolean(integration.token)
  ).length;

const canConnectChannel = (
  profile: NonNullable<Awaited<ReturnType<typeof findUser>>>,
  strategy: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP"
) => {
  const capabilities = getPlanCapabilities(profile.subscription?.plan ?? "FREE");

  if (capabilities.plan !== "FREE") {
    return { ok: true as const };
  }

  const existingReady = profile.integrations.filter((integration) =>
    integration.name === "FACEBOOK_MESSENGER"
      ? Boolean(integration.token && integration.facebookPageId)
      : integration.name === "WHATSAPP"
        ? Boolean(integration.token && integration.whatsappPhoneNumberId)
      : Boolean(integration.token)
  );

  const alreadyConnectedThisChannel = existingReady.some(
    (integration) => integration.name === strategy
  );

  if (alreadyConnectedThisChannel) {
    return { ok: true as const };
  }

  if (getConnectedChannelCount(profile) >= capabilities.maxConnectedChannels) {
    return {
      ok: false as const,
      message:
        "Free includes one connected channel at a time. Disconnect the current channel or upgrade to Pro.",
    };
  }

  return { ok: true as const };
};

export const onOAuthInstagram = (
  strategy: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP"
) => {
  if (strategy === "INSTAGRAM") {
    return redirect(buildInstagramAuthorizeUrl());
  }

  if (strategy === "WHATSAPP") {
    return redirect("/dashboard/integrations");
  }

  return redirect(buildFacebookAuthorizeUrl());
};

const igMeUrl = (accessToken: string) =>
  `${process.env.INSTAGRAM_BASE_URL}/${INSTAGRAM_GRAPH_API_VERSION}/me?fields=user_id&access_token=${accessToken}`;

const getInstagramProfileRedirect = async (userId: string) => {
  return "/dashboard/integrations";
};

const getFacebookProfileRedirect = async (userId: string) => {
  return "/dashboard/integrations";
};

const getWhatsAppProfileRedirect = async (userId: string) => {
  return "/dashboard/integrations";
};

const withIntegrationStatus = (
  href: string,
  type: "integration_notice" | "integration_error",
  code: string
) => {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${type}=${encodeURIComponent(code)}`;
};

const getFacebookPageConflictRedirect = async (userId: string) =>
  withIntegrationStatus(
    await getFacebookProfileRedirect(userId),
    "integration_error",
    "facebook-page-already-connected"
  );

const getFacebookErrorCode = (error: unknown) => {
  if (isUniqueConstraintError(error, "Integrations_facebookPageId_key")) {
    return "facebook-page-already-connected" as const;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code =
      error.response?.data?.error?.code ??
      error.response?.data?.error_code ??
      null;

    if (status === 401 || status === 400) {
      return "facebook-auth-invalid" as const;
    }

    if (status === 403) {
      return "facebook-permission-missing" as const;
    }

    if (status === 429) {
      return "facebook-rate-limited" as const;
    }

    if (code === 10 || code === 200) {
      return "facebook-permission-missing" as const;
    }
  }

  if (
    error instanceof Error &&
    (error.message.includes("CONNECT_TIMEOUT") ||
      (typeof (error as { cause?: { code?: string } }).cause?.code === "string" &&
        (error as { cause?: { code?: string } }).cause?.code === "CONNECT_TIMEOUT"))
  ) {
    return "service-timeout" as const;
  }

  return "facebook-connect-failed" as const;
};

const getWhatsAppErrorCode = (error: unknown) => {
  if (isUniqueConstraintError(error, "Integrations_whatsappPhoneNumberId_key")) {
    return "whatsapp-number-already-connected" as const;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401 || status === 400) {
      return "whatsapp-auth-invalid" as const;
    }

    if (status === 403) {
      return "whatsapp-permission-missing" as const;
    }

    if (status === 429) {
      return "whatsapp-rate-limited" as const;
    }
  }

  return "whatsapp-connect-failed" as const;
};

const resolveWhatsAppIntegrationToken = () => {
  const token = getWhatsAppSystemUserToken().trim();
  return token.length > 0 ? token : null;
};

const getLongLivedWhatsAppExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 5);
  return expiresAt;
};

export const onIntegrate = async (code: string) => {
  const user = await onCurrentUser();

  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return { status: access.status, data: null };
    }

    const channelAccess = canConnectChannel(access.profile, "INSTAGRAM");
    if (!channelAccess.ok) {
      return {
        status: 403 as const,
        data: {
          redirectTo: await getInstagramProfileRedirect(user.id),
          errorCode: "free-channel-limit" as const,
        },
      };
    }

    const integration = await getIntegration(user.id, "INSTAGRAM");

    if (!integration) {
      return { status: 404 as const, data: null };
    }

    const token = await generateTokens(code);

    if (!token?.access_token) {
      return { status: 401 as const, data: null };
    }

    const instaResponse = await axios.get(igMeUrl(token.access_token));
    const instagramId = String(instaResponse.data.user_id ?? "");

    if (!instagramId) {
      return {
        status: 400 as const,
        data: {
          redirectTo: await getInstagramProfileRedirect(user.id),
          errorCode: "instagram-account-unavailable" as const,
        },
      };
    }

    const today = new Date();
    today.setDate(today.getDate() + 60);
    const expiresAt = new Date(today);
    const existingByInstagramId = await findIntegrationByInstagramId(instagramId);

    if (existingByInstagramId && existingByInstagramId.userId !== user.id) {
      return {
        status: 409 as const,
        data: {
          redirectTo: await getInstagramProfileRedirect(user.id),
          errorCode: "instagram-already-connected" as const,
        },
      };
    }

    if (existingByInstagramId && existingByInstagramId.userId === user.id) {
      await updateIntegration(token.access_token, expiresAt, existingByInstagramId.id, {
        instagramId,
      });
      revalidateUserProfile(user.id);
      return {
        status: 200 as const,
        data: {
          redirectTo: await getInstagramProfileRedirect(user.id),
        },
      };
    }

    if (integration.integrations.length === 0) {
      await createIntegration(user.id, "INSTAGRAM", token.access_token, expiresAt, {
        instagramId,
      });
      revalidateUserProfile(user.id);
      return {
        status: 200 as const,
        data: {
          redirectTo: await getInstagramProfileRedirect(user.id),
        },
      };
    }

    const existing = integration.integrations[0];
    await updateIntegration(token.access_token, expiresAt, existing.id, {
      instagramId,
    });
    revalidateUserProfile(user.id);

    return {
      status: 200 as const,
      data: {
        redirectTo: await getInstagramProfileRedirect(user.id),
      },
    };
  } catch (error) {
    if (isUniqueConstraintError(error, "Integrations_instagramId_key")) {
      return {
        status: 409 as const,
        data: {
          redirectTo: await getInstagramProfileRedirect(user.id),
          errorCode: "instagram-already-connected" as const,
        },
      };
    }

    console.log("instagram integration failed", error);
    return { status: 500 as const, data: null };
  }
};

export const onIntegrateFacebook = async (code: string) => {
  const user = await onCurrentUser();

  try {
    logFacebookIntegration("oauth_callback_started", {
      userId: getShortUserId(user.id),
      hasCode: Boolean(code),
      codeLength: code?.length ?? 0,
    });

    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      logFacebookIntegration("access_blocked", {
        userId: getShortUserId(user.id),
        status: access.status,
      });
      return { status: access.status, data: null };
    }

    const channelAccess = canConnectChannel(access.profile, "FACEBOOK_MESSENGER");
    if (!channelAccess.ok) {
      logFacebookIntegration("free_channel_limit_blocked", {
        userId: getShortUserId(user.id),
      });
      return {
        status: 403 as const,
        data: {
          redirectTo: withIntegrationStatus(
            await getFacebookProfileRedirect(user.id),
            "integration_error",
            "free-channel-limit"
          ),
        },
      };
    }

    const integration = await getIntegration(user.id, "FACEBOOK_MESSENGER");
    const token = await generateFacebookUserToken(code);

    if (!token?.access_token) {
      logFacebookIntegration("token_exchange_failed", {
        userId: getShortUserId(user.id),
        hasTokenPayload: Boolean(token),
      });
      return {
        status: 401 as const,
        data: {
          redirectTo: withIntegrationStatus(
            await getFacebookProfileRedirect(user.id),
            "integration_error",
            "facebook-connect-failed"
          ),
        },
      };
    }

    logFacebookIntegration("token_exchange_succeeded", {
      userId: getShortUserId(user.id),
      hasExpiresIn: token.expires_in !== undefined && token.expires_in !== null,
      expiresInType: typeof token.expires_in,
    });

    const pages = await getFacebookPages(token.access_token);
    logFacebookIntegration("pages_fetched", {
      userId: getShortUserId(user.id),
      pageCount: pages.length,
      pageIds: pages.map((page) => page.id),
    });

    if (!pages.length) {
      logFacebookIntegration("no_pages_found", {
        userId: getShortUserId(user.id),
      });
      return {
        status: 404 as const,
        data: {
          redirectTo: withIntegrationStatus(
            await getFacebookProfileRedirect(user.id),
            "integration_error",
            "facebook-no-pages"
          ),
        },
      };
    }

    const { expiresAt, usedFallback } = resolveTokenExpiry(token.expires_in);

    if (!Number.isFinite(expiresAt.getTime())) {
      console.warn("[security:integration] facebook_token_expiry_invalid", {
        userId: getShortUserId(user.id),
      });
      logFacebookIntegration("token_expiry_invalid", {
        userId: getShortUserId(user.id),
        expiresIn: token.expires_in ?? null,
      });

      return {
        status: 400 as const,
        data: {
          redirectTo: withIntegrationStatus(
            await getFacebookProfileRedirect(user.id),
            "integration_error",
            "facebook-token-invalid"
          ),
        },
      };
    }

    if (usedFallback) {
      console.warn("[security:integration] facebook_token_expiry_fallback", {
        userId: getShortUserId(user.id),
      });
      logFacebookIntegration("token_expiry_fallback_used", {
        userId: getShortUserId(user.id),
        expiresIn: token.expires_in ?? null,
      });
    }

    if (pages.length === 1) {
      const page = pages[0];
      const existingByPageId = await findIntegrationByFacebookPageId(page.id);

      if (existingByPageId && existingByPageId.userId !== user.id) {
        logFacebookIntegration("page_conflict_other_user", {
          userId: getShortUserId(user.id),
          pageId: page.id,
        });
        return {
          status: 409 as const,
          data: {
            redirectTo: await getFacebookPageConflictRedirect(user.id),
          },
        };
      }

      if (existingByPageId && existingByPageId.userId === user.id) {
        logFacebookIntegration("page_reused_same_user", {
          userId: getShortUserId(user.id),
          pageId: page.id,
          integrationId: existingByPageId.id,
        });
        await updateIntegration(page.access_token, expiresAt, existingByPageId.id, {
          facebookPageId: page.id,
          pageName: page.name,
        });

        revalidateUserProfile(user.id);
        return {
          status: 200 as const,
          data: {
            redirectTo: withIntegrationStatus(
              await getFacebookProfileRedirect(user.id),
              "integration_notice",
              "facebook-connected"
            ),
          },
        };
      }

      if (integration?.integrations.length) {
        logFacebookIntegration("integration_updated_existing_slot", {
          userId: getShortUserId(user.id),
          pageId: page.id,
          integrationId: integration.integrations[0].id,
        });
        await updateIntegration(page.access_token, expiresAt, integration.integrations[0].id, {
          facebookPageId: page.id,
          pageName: page.name,
        });
      } else {
        logFacebookIntegration("integration_created", {
          userId: getShortUserId(user.id),
          pageId: page.id,
        });
        await createIntegration(user.id, "FACEBOOK_MESSENGER", page.access_token, expiresAt, {
          facebookPageId: page.id,
          pageName: page.name,
        });
      }

      revalidateUserProfile(user.id);
      return {
        status: 200 as const,
        data: {
          redirectTo: withIntegrationStatus(
            await getFacebookProfileRedirect(user.id),
            "integration_notice",
            "facebook-connected"
          ),
        },
      };
    }

    return {
      status: 202 as const,
      data: {
        pages: pages.map((page) => ({
          id: page.id,
          name: page.name,
          selectionToken: createPendingFacebookSelection(user.id, {
            id: page.id,
            name: page.name,
            accessToken: page.access_token,
          }),
        })),
      },
    };
  } catch (error) {
    const errorCode = getFacebookErrorCode(error);
    logFacebookIntegration("oauth_callback_failed", {
      userId: getShortUserId(user.id),
      errorCode,
      error: getErrorSummary(error),
    });

    if (errorCode === "facebook-page-already-connected") {
      return {
        status: 409 as const,
        data: {
          redirectTo: await getFacebookPageConflictRedirect(user.id),
        },
      };
    }

    console.warn("[security:integration] facebook_connect_failed", {
      reason: error instanceof Error ? error.message : "unknown",
      userId: getShortUserId(user.id),
    });
    return {
      status: 500 as const,
      data: {
        redirectTo: withIntegrationStatus(
          await getFacebookProfileRedirect(user.id),
          "integration_error",
          errorCode
        ),
      },
    };
  }
};

export const connectSelectedFacebookPage = async (formData: FormData) => {
  const user = await onCurrentUser();
  const profileRedirect = await getFacebookProfileRedirect(user.id);
  try {
    logFacebookIntegration("page_selection_started", {
      userId: getShortUserId(user.id),
      hasSelectionToken: Boolean(formData.get("selectionToken")),
    });
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return redirect("/dashboard");
    }
    const channelAccess = canConnectChannel(access.profile, "FACEBOOK_MESSENGER");
    if (!channelAccess.ok) {
      return redirect(
        withIntegrationStatus(profileRedirect, "integration_error", "free-channel-limit")
      );
    }
    const selectionToken = String(formData.get("selectionToken") ?? "");

    const selection = decodePendingFacebookSelection(selectionToken);
    if (!selection || selection.userId !== user.id) {
      logFacebookIntegration("page_selection_expired", {
        userId: getShortUserId(user.id),
      });
      return redirect(
        withIntegrationStatus(
          profileRedirect,
          "integration_error",
          "facebook-session-expired"
        )
      );
    }

    const integration = await getIntegration(user.id, "FACEBOOK_MESSENGER");
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const existingByPageId = await findIntegrationByFacebookPageId(selection.pageId);

    if (existingByPageId && existingByPageId.userId !== user.id) {
      logFacebookIntegration("page_selection_conflict_other_user", {
        userId: getShortUserId(user.id),
        pageId: selection.pageId,
      });
      return redirect(await getFacebookPageConflictRedirect(user.id));
    }

    if (existingByPageId && existingByPageId.userId === user.id) {
      logFacebookIntegration("page_selection_reused_same_user", {
        userId: getShortUserId(user.id),
        pageId: selection.pageId,
        integrationId: existingByPageId.id,
      });
      await updateIntegration(
        selection.accessToken,
        expiresAt,
        existingByPageId.id,
        {
          facebookPageId: selection.pageId,
          pageName: selection.pageName,
        }
      );

      revalidateUserProfile(user.id);
      return redirect(
        withIntegrationStatus(
          profileRedirect,
          "integration_notice",
          "facebook-connected"
        )
      );
    }

    if (integration?.integrations.length) {
      logFacebookIntegration("page_selection_updated_existing_slot", {
        userId: getShortUserId(user.id),
        pageId: selection.pageId,
        integrationId: integration.integrations[0].id,
      });
      await updateIntegration(
        selection.accessToken,
        expiresAt,
        integration.integrations[0].id,
        {
          facebookPageId: selection.pageId,
          pageName: selection.pageName,
        }
      );
    } else {
      logFacebookIntegration("page_selection_created", {
        userId: getShortUserId(user.id),
        pageId: selection.pageId,
      });
      await createIntegration(
        user.id,
        "FACEBOOK_MESSENGER",
        selection.accessToken,
        expiresAt,
        {
          facebookPageId: selection.pageId,
          pageName: selection.pageName,
        }
      );
    }

    revalidateUserProfile(user.id);
    return redirect(
      withIntegrationStatus(profileRedirect, "integration_notice", "facebook-connected")
    );
  } catch (error) {
    const errorCode = getFacebookErrorCode(error);
    logFacebookIntegration("page_selection_failed", {
      userId: getShortUserId(user.id),
      errorCode,
      error: getErrorSummary(error),
    });

    if (errorCode === "facebook-page-already-connected") {
      return redirect(await getFacebookPageConflictRedirect(user.id));
    }

    console.warn("[security:integration] facebook_page_selection_failed", {
      reason: error instanceof Error ? error.message : "unknown",
      userId: getShortUserId(user.id),
    });
    return redirect(
      withIntegrationStatus(
        profileRedirect,
        "integration_error",
        errorCode
      )
    );
  }
};

export const completeWhatsAppEmbeddedSignup = async (input: {
  wabaId: string;
  phoneNumberId: string;
}) => {
  const user = await onCurrentUser();
  const profileRedirect = await getWhatsAppProfileRedirect(user.id);

  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return { status: access.status, data: access.data };
    }

    const channelAccess = canConnectChannel(access.profile, "WHATSAPP");
    if (!channelAccess.ok) {
      return {
        status: 403 as const,
        data: {
          redirectTo: withIntegrationStatus(
            profileRedirect,
            "integration_error",
            "free-channel-limit"
          ),
        },
      };
    }

    const systemToken = resolveWhatsAppIntegrationToken();
    if (!systemToken) {
      return {
        status: 500 as const,
        data: {
          redirectTo: withIntegrationStatus(
            profileRedirect,
            "integration_error",
            "whatsapp-config-missing"
          ),
        },
      };
    }

    const integration = await getIntegration(user.id, "WHATSAPP");
    const phoneDetails = await getWhatsAppPhoneNumberDetails(
      input.phoneNumberId,
      systemToken
    );

    try {
      await subscribeAppToWhatsAppBusinessAccount(input.wabaId, systemToken);
    } catch (error) {
      console.warn("[developer:whatsapp] subscribe_app_failed", getErrorSummary(error));
    }

    const whatsappPhoneNumberId = String(
      phoneDetails.id ?? input.phoneNumberId ?? ""
    );
    if (!whatsappPhoneNumberId) {
      return {
        status: 400 as const,
        data: {
          redirectTo: withIntegrationStatus(
            profileRedirect,
            "integration_error",
            "whatsapp-phone-unavailable"
          ),
        },
      };
    }

    const existingByPhoneNumberId = await findIntegrationByWhatsAppPhoneNumberId(
      whatsappPhoneNumberId
    );

    if (existingByPhoneNumberId && existingByPhoneNumberId.userId !== user.id) {
      return {
        status: 409 as const,
        data: {
          redirectTo: withIntegrationStatus(
            profileRedirect,
            "integration_error",
            "whatsapp-number-already-connected"
          ),
        },
      };
    }

    const expiresAt = getLongLivedWhatsAppExpiry();
    const meta = {
      whatsappBusinessAccountId: input.wabaId,
      whatsappPhoneNumberId,
      whatsappBusinessPhone:
        phoneDetails.display_phone_number ?? input.phoneNumberId,
      whatsappDisplayName:
        phoneDetails.verified_name ?? phoneDetails.display_phone_number ?? "WhatsApp",
    };

    if (existingByPhoneNumberId && existingByPhoneNumberId.userId === user.id) {
      await updateIntegration(systemToken, expiresAt, existingByPhoneNumberId.id, meta);
    } else if (integration?.integrations.length) {
      await updateIntegration(systemToken, expiresAt, integration.integrations[0].id, meta);
    } else {
      await createIntegration(user.id, "WHATSAPP", systemToken, expiresAt, meta);
    }

    revalidateUserProfile(user.id);
    return {
      status: 200 as const,
      data: {
        redirectTo: withIntegrationStatus(
          profileRedirect,
          "integration_notice",
          "whatsapp-connected"
        ),
      },
    };
  } catch (error) {
    const errorCode = getWhatsAppErrorCode(error);
    return {
      status: 500 as const,
      data: {
        redirectTo: withIntegrationStatus(
          profileRedirect,
          "integration_error",
          errorCode
        ),
      },
    };
  }
};

export const deleteIntegration = async (integrationId: string) => {
  const user = await onCurrentUser();

  try {
    const access = await getPackageMutationContext(user.id);
    if (!access.ok) {
      return { status: access.status, data: access.data };
    }

    const profile = await findUser(user.id);
    if (!profile?.id) {
      return { status: 404 as const, data: "User not found" };
    }

    const deleted = await deleteIntegrationById(integrationId, profile.id);
    if (!deleted) {
      return { status: 404 as const, data: "Integration not found" };
    }

    revalidateUserProfile(user.id);
    return { status: 200 as const, data: "Integration deleted" };
  } catch (error) {
    console.log("integration delete failed", error);
    return { status: 500 as const, data: "Oops! something went wrong" };
  }
};
