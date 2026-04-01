import {
  getFacebookPageIntegration,
  getCurrentBillingUsage,
  getKeywordAutomation,
  getKeywordPost,
  incrementBillingUsage,
  logAutomationEvent,
  matchKeyword,
  trackResponses,
} from "@/actions/webhook/queries";
import { getCurrentBillingPeriodBounds } from "@/lib/billing";
import {
  findProcessedExternalEvent,
  markProcessedExternalEvent,
} from "@/actions/user/queries";
import {
  getFacebookCommentDetails,
  sendFacebookCommentReply,
} from "@/lib/fetch";
import { AUTOMATION_EVENT_STATUS, AUTOMATION_EVENT_TYPE } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { ensurePackageRuntimeAccess } from "@/lib/billing-access";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

type FacebookPageConnection = {
  token: string;
  facebookPageId: string | null;
  pageName: string | null;
  userId?: string | null;
};

const logWebhookEvent = (payload: any) => {
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  logSecurityEvent("webhook", "facebook_event_received", {
    pageId: entry?.id ?? null,
    commentId: change?.value?.comment_id ?? change?.value?.id ?? null,
    postId: change?.value?.post_id ?? null,
    verb: change?.value?.verb ?? null,
  });
};

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expectedToken =
    process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? process.env.WEBHOOK_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    challenge &&
    token &&
    expectedToken &&
    token === expectedToken
  ) {
    console.log("[facebook:webhook] verification_success");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[facebook:webhook] verification_failed");
  return NextResponse.json(
    {
      message: "Webhook verification failed",
    },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req.headers);
  const rateLimit = applyRateLimit({
    key: `webhook:facebook:${ip}`,
    limit: 240,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.ok) {
    logSecurityEvent("webhook", "facebook_rate_limited", { ip });
    return NextResponse.json({ message: "Event ignored" }, { status: 429 });
  }

  const payload = await req.json();
  logWebhookEvent(payload);

  try {
    const entry = payload?.entry?.[0];
    const commentChange = entry?.changes?.[0];
    const isCommentEvent =
      commentChange?.field === "feed" && commentChange?.value?.item === "comment";
    const pageId = entry?.id ?? null;
    const senderId = commentChange?.value?.from?.id ?? null;
    const verb = commentChange?.value?.verb ?? null;
    const rawCommentText = commentChange?.value?.message;
    const commentId =
      commentChange?.value?.comment_id ?? commentChange?.value?.id ?? null;
    const webhookEventId = typeof commentId === "string" ? commentId : null;

    if (webhookEventId) {
      const processed = await findProcessedExternalEvent("FACEBOOK", webhookEventId);
      if (processed) {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }
    }

    let postId = commentChange?.value?.post_id ?? null;
    let commentText =
      typeof rawCommentText === "string" ? rawCommentText.trim() : "";

    let pageIntegration: FacebookPageConnection | null =
      pageId && typeof pageId === "string"
        ? await getFacebookPageIntegration(pageId).then((integration) =>
            integration
              ? {
                  token: integration.token,
                  facebookPageId: integration.facebookPageId,
                  pageName: integration.pageName,
                  userId: integration.userId,
                }
              : null
          )
        : null;

    if (isCommentEvent && commentId && !commentText && pageIntegration?.token) {
      try {
        const commentDetails = await getFacebookCommentDetails(
          commentId,
          pageIntegration.token
        );

        commentText =
          typeof commentDetails.message === "string"
            ? commentDetails.message.trim()
            : "";
        postId = commentDetails.post?.id ?? postId;

        console.log("[facebook:webhook] fetched_comment_details", {
          pageId,
          commentId,
          postId,
          hasCommentText: Boolean(commentText),
        });
      } catch (error) {
        console.log("[facebook:webhook] comment_details_lookup_failed", {
          pageId,
          commentId,
          postId,
          reason: "graph_lookup_failed_or_missing_permission",
        });
      }
    }

    if (isCommentEvent && pageIntegration?.userId) {
      await logAutomationEvent({
        userId: pageIntegration.userId,
        channel: "FACEBOOK_MESSENGER",
        triggerType: "COMMENT",
        eventType: AUTOMATION_EVENT_TYPE.COMMENT_RECEIVED,
        senderId,
        postId,
        commentId,
        status: AUTOMATION_EVENT_STATUS.INFO,
      });
    }

    logSecurityEvent("webhook", "facebook_comment_event_detected", {
      hasComment: Boolean(isCommentEvent),
      pageId,
      senderId,
      verb,
      hasCommentText: Boolean(commentText),
    });

    if (!isCommentEvent || verb !== "add") {
      if (pageIntegration?.userId) {
        await logAutomationEvent({
          userId: pageIntegration.userId,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "not_new_comment_event",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "not_new_comment_event",
        verb,
      });
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    if (pageId && senderId && pageId === senderId) {
      if (pageIntegration?.userId) {
        await logAutomationEvent({
          userId: pageIntegration.userId,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "page_authored_comment",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "page_authored_comment",
        pageId,
        senderId,
      });
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    if (!commentText) {
      if (pageIntegration?.userId) {
        await logAutomationEvent({
          userId: pageIntegration.userId,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "missing_comment_text",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "missing_comment_text",
      });
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const matcher = await matchKeyword(
      commentText,
      "FACEBOOK_MESSENGER",
      "COMMENT"
    );

    logSecurityEvent("webhook", "facebook_keyword_match", {
      triggerType: "COMMENT",
      matched: Boolean(matcher),
      automationId: matcher?.automationId ?? null,
    });

    if (!matcher?.automationId) {
      if (pageIntegration?.userId) {
        await logAutomationEvent({
          userId: pageIntegration.userId,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "no_comment_automation_match",
        });
      }
      console.log("[facebook:webhook] no_automation_response", {
        reason: "no_comment_automation_match",
        hasTriggerText: Boolean(commentText),
      });
      return NextResponse.json({ message: "No automation set" }, { status: 200 });
    }

    if (pageIntegration?.userId) {
      await logAutomationEvent({
        userId: pageIntegration.userId,
        automationId: matcher.automationId,
        channel: "FACEBOOK_MESSENGER",
        triggerType: "COMMENT",
        eventType: AUTOMATION_EVENT_TYPE.KEYWORD_MATCHED,
        senderId,
        postId,
        commentId,
        status: AUTOMATION_EVENT_STATUS.SUCCESS,
      });
    }

    const automation = await getKeywordAutomation(
      matcher.automationId,
      false,
      "FACEBOOK_MESSENGER"
    );

    console.log("[facebook:webhook] automation_lookup", {
      automationId: matcher.automationId,
      found: Boolean(automation),
      listener: automation?.listener?.listener ?? null,
      triggerCount: automation?.trigger?.length ?? 0,
      integrationCount: automation?.User?.integrations?.length ?? 0,
    });

    const automationUserId = automation?.User?.id ?? pageIntegration?.userId ?? null;

    if (!automation?.listener || automation.listener.listener !== "MESSAGE") {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: matcher.automationId,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "facebook_requires_message_listener",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "facebook_requires_standard_message_listener",
        automationId: matcher.automationId,
      });
      return NextResponse.json({ message: "No automation set" }, { status: 200 });
    }

    const automationPageIntegration: FacebookPageConnection | null =
      automation.User?.integrations?.[0]
        ? {
            token: automation.User.integrations[0].token,
            facebookPageId: automation.User.integrations[0].facebookPageId,
            pageName: automation.User.integrations[0].pageName,
            userId: automation.User.id,
          }
        : null;
    const pageToken = automationPageIntegration?.token ?? pageIntegration?.token;

    if (!pageToken) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation?.id ?? matcher.automationId,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "missing_page_connection_token",
        });
      }
      console.log("[facebook:webhook] missing_page_connection", {
        automationId: automation.id,
        pageId:
          automationPageIntegration?.facebookPageId ??
          pageIntegration?.facebookPageId ??
          entry?.id ??
          null,
        hasToken: false,
      });
      return NextResponse.json(
        { message: "Facebook page connection missing" },
        { status: 200 }
      );
    }

    if (!commentId || !postId) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "missing_comment_or_post_id",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "missing_comment_or_post_id",
        automationId: automation.id,
        commentId,
        postId,
      });
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const matchedPost = await getKeywordPost(postId, automation.id);
    console.log("[facebook:webhook] comment_post_lookup", {
      automationId: automation.id,
      postId,
      matchedPost: Boolean(matchedPost),
    });

    if (!matchedPost) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "comment_post_not_attached_to_automation",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "comment_post_not_attached_to_automation",
        automationId: automation.id,
        postId,
      });
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const publicReply =
      automation.listener.commentReply?.trim() ||
      automation.listener.prompt?.trim() ||
      "";
    const subscription = automation.User?.subscription;
    const currentPeriod = getCurrentBillingPeriodBounds(subscription);
    const currentUsage =
      automationUserId &&
      currentPeriod
        ? await getCurrentBillingUsage(
            automationUserId,
            currentPeriod.periodStart,
            currentPeriod.periodEnd
          )
        : null;
    const deliveryAccess = ensurePackageRuntimeAccess(
      subscription,
      currentUsage,
      "facebookCommentReplies"
    );

    if (!deliveryAccess.ok) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: deliveryAccess.message,
        });
      }
      return NextResponse.json({ message: "Delivery blocked" }, { status: 200 });
    }

    if (!publicReply) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "missing_public_reply_content",
        });
      }
      console.log("[facebook:webhook] ignored_event", {
        reason: "missing_public_reply_content",
        automationId: automation.id,
      });
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    try {
      console.log("[facebook:webhook] send_attempt", {
        mode: "COMMENT_PUBLIC_REPLY",
        automationId: automation.id,
        commentId,
      });
      const publicCommentResponse = await sendFacebookCommentReply(
        commentId,
        publicReply,
        pageToken
      );
      console.log("[facebook:webhook] send_result", {
        mode: "COMMENT_PUBLIC_REPLY",
        automationId: automation.id,
        status: publicCommentResponse.status,
      });

      if (publicCommentResponse.status === 200) {
        await trackResponses(automation.id, "COMMENT");
        if (automationUserId) {
          await logAutomationEvent({
            userId: automationUserId,
            automationId: automation.id,
            channel: "FACEBOOK_MESSENGER",
            triggerType: "COMMENT",
            eventType: AUTOMATION_EVENT_TYPE.COMMENT_REPLY_SENT,
            senderId,
            postId,
            commentId,
            status: AUTOMATION_EVENT_STATUS.SUCCESS,
          });
          if (currentPeriod) {
            await incrementBillingUsage(
              automationUserId,
              subscription?.id ?? null,
              currentPeriod.periodStart,
              currentPeriod.periodEnd,
              "facebookCommentReplies"
            );
          }
        }
        console.log("[facebook:webhook] response_tracked", {
          automationId: automation.id,
          type: "COMMENT",
        });
        if (webhookEventId) {
          await markProcessedExternalEvent("FACEBOOK", webhookEventId, "SUCCESS");
        }
        return NextResponse.json(
          {
            message: "Facebook public reply sent",
          },
          { status: 200 }
        );
      }
    } catch (error) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "FACEBOOK_MESSENGER",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.DELIVERY_FAILED,
          senderId,
          postId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.ERROR,
          reason: "facebook_comment_reply_failed",
        });
      }
      console.log("[facebook:webhook] public_reply_failed", {
        automationId: automation.id,
        commentId,
      });
    }

    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  } catch (error) {
    logSecurityEvent("webhook", "facebook_handler_error", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  }
}
