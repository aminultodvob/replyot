import {
  getInstagramAccountIntegration,
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
import { sendDM, sendInstagramCommentReply, sendPrivateMessage } from "@/lib/fetch";
import { AUTOMATION_EVENT_STATUS, AUTOMATION_EVENT_TYPE } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { ensurePackageRuntimeAccess } from "@/lib/billing-access";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

const logWebhookEvent = (payload: any) => {
  const entry = payload?.entry?.[0];
  const messaging = entry?.messaging?.[0];
  const change = entry?.changes?.[0];
  logSecurityEvent("webhook", "instagram_event_received", {
    accountId: entry?.id ?? null,
    messageId: messaging?.message?.mid ?? null,
    commentId: change?.value?.id ?? null,
    mediaId: change?.value?.media?.id ?? null,
  });
};

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN;

  console.log("[instagram:webhook] verification_request", {
    mode,
    tokenPresent: Boolean(token),
    challengePresent: Boolean(hub),
  });

  if (
    mode === "subscribe" &&
    hub &&
    token &&
    expectedToken &&
    token === expectedToken
  ) {
    console.log("[instagram:webhook] verification_success");
    return new NextResponse(hub, { status: 200 });
  }

  console.log("[instagram:webhook] verification_failed", {
    expectedTokenPresent: Boolean(expectedToken),
  });
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
    key: `webhook:instagram:${ip}`,
    limit: 240,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    logSecurityEvent("webhook", "instagram_rate_limited", { ip });
    return NextResponse.json({ message: "Event ignored" }, { status: 429 });
  }

  const webhookPayload = await req.json();
  logWebhookEvent(webhookPayload);

  try {
    const entry = webhookPayload?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const commentChange = entry?.changes?.[0];
    const isMessageEvent = Boolean(messaging?.message?.text);
    const isCommentEvent = commentChange?.field === "comments";
    const commentText = commentChange?.value?.text ?? null;
    const commentId = commentChange?.value?.id ?? null;
    const mediaId = commentChange?.value?.media?.id ?? null;
    const accountId = entry?.id ?? null;
    const webhookEventId =
      (typeof messaging?.message?.mid === "string" &&
        messaging.message.mid) ||
      (typeof commentId === "string" && commentId) ||
      null;

    if (webhookEventId) {
      const processed = await findProcessedExternalEvent("INSTAGRAM", webhookEventId);
      if (processed) {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }
    }

    const accountIntegration =
      accountId && typeof accountId === "string"
        ? await getInstagramAccountIntegration(accountId)
        : null;

    logSecurityEvent("webhook", "instagram_event_detected", {
      isMessageEvent,
      isCommentEvent,
      accountId,
      commentId,
      mediaId,
    });

    if (isMessageEvent && accountIntegration?.userId) {
      await logAutomationEvent({
        userId: accountIntegration.userId,
        channel: "INSTAGRAM",
        triggerType: "DM",
        eventType: AUTOMATION_EVENT_TYPE.DM_RECEIVED,
        senderId: messaging?.sender?.id ?? null,
        status: AUTOMATION_EVENT_STATUS.INFO,
      });
    }

    if (isCommentEvent && accountIntegration?.userId) {
      await logAutomationEvent({
        userId: accountIntegration.userId,
        channel: "INSTAGRAM",
        triggerType: "COMMENT",
        eventType: AUTOMATION_EVENT_TYPE.COMMENT_RECEIVED,
        senderId: commentChange?.value?.from?.id ?? null,
        postId: mediaId,
        commentId,
        status: AUTOMATION_EVENT_STATUS.INFO,
      });
    }

    const matcher = isMessageEvent
      ? await matchKeyword(messaging.message.text, "INSTAGRAM", "DM")
      : isCommentEvent
        ? await matchKeyword(commentChange?.value?.text, "INSTAGRAM", "COMMENT")
        : null;

    logSecurityEvent("webhook", "instagram_keyword_match", {
      triggerType: isMessageEvent ? "DM" : isCommentEvent ? "COMMENT" : null,
      matched: Boolean(matcher?.automationId),
      automationId: matcher?.automationId ?? null,
    });

    if (!matcher?.automationId) {
      if (accountIntegration?.userId) {
        await logAutomationEvent({
          userId: accountIntegration.userId,
          channel: "INSTAGRAM",
          triggerType: isMessageEvent ? "DM" : isCommentEvent ? "COMMENT" : null,
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId: isMessageEvent ? messaging?.sender?.id ?? null : commentChange?.value?.from?.id ?? null,
          postId: mediaId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "keyword_not_matched",
        });
      }
      logSecurityEvent("webhook", "instagram_no_match", {
        reason: "keyword_not_matched",
        triggerType: isMessageEvent ? "DM" : isCommentEvent ? "COMMENT" : null,
      });
      return NextResponse.json(
        {
          message: "No automation set",
        },
        { status: 200 }
      );
    }

    if (isMessageEvent) {
      const automation = await getKeywordAutomation(
        matcher.automationId,
        false,
        "INSTAGRAM"
      );
      const automationUserId = automation?.User?.id ?? accountIntegration?.userId;

      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: matcher.automationId,
          channel: "INSTAGRAM",
          triggerType: "DM",
          eventType: AUTOMATION_EVENT_TYPE.KEYWORD_MATCHED,
          senderId: messaging?.sender?.id ?? null,
          status: AUTOMATION_EVENT_STATUS.SUCCESS,
        });
      }

      console.log("[instagram:webhook] automation_lookup", {
        automationId: matcher.automationId,
        found: Boolean(automation),
        listener: automation?.listener?.listener ?? null,
        hasToken: Boolean(automation?.User?.integrations[0]?.token),
      });

      if (
        !automation?.listener ||
        automation.listener.listener !== "MESSAGE" ||
        !automation.User?.integrations[0]?.token
      ) {
        if (automationUserId) {
          await logAutomationEvent({
            userId: automationUserId,
            automationId: matcher.automationId,
            channel: "INSTAGRAM",
            triggerType: "DM",
            eventType: AUTOMATION_EVENT_TYPE.IGNORED,
            senderId: messaging?.sender?.id ?? null,
            status: AUTOMATION_EVENT_STATUS.INFO,
            reason: "missing_listener_or_token_for_dm",
          });
        }
        console.log("[instagram:webhook] ignored_event", {
          reason: "missing_listener_or_token_for_dm",
          automationId: matcher.automationId,
        });
        return NextResponse.json(
          {
            message: "No automation set",
          },
          { status: 200 }
        );
      }

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
        "instagramDmReplies"
      );

      if (!deliveryAccess.ok) {
        if (automationUserId) {
          await logAutomationEvent({
            userId: automationUserId,
            automationId: automation.id,
            channel: "INSTAGRAM",
            triggerType: "DM",
            eventType: AUTOMATION_EVENT_TYPE.IGNORED,
            senderId: messaging?.sender?.id ?? null,
            status: AUTOMATION_EVENT_STATUS.INFO,
            reason: deliveryAccess.message,
          });
        }
        return NextResponse.json({ message: "Delivery blocked" }, { status: 200 });
      }

      try {
        const directMessage = await sendDM(
          entry.id,
          messaging.sender.id,
          automation.listener.prompt,
          automation.User.integrations[0].token
        );

        console.log("[instagram:webhook] send_result", {
          mode: "DM",
          automationId: automation.id,
          status: directMessage.status,
        });

        if (directMessage.status === 200) {
          await trackResponses(automation.id, "DM");
          if (automationUserId) {
            await logAutomationEvent({
              userId: automationUserId,
              automationId: automation.id,
              channel: "INSTAGRAM",
              triggerType: "DM",
              eventType: AUTOMATION_EVENT_TYPE.DM_REPLY_SENT,
              senderId: messaging?.sender?.id ?? null,
            status: AUTOMATION_EVENT_STATUS.SUCCESS,
          });
            if (currentPeriod) {
              await incrementBillingUsage(
                automationUserId,
                subscription?.id ?? null,
                currentPeriod.periodStart,
                currentPeriod.periodEnd,
                "instagramDmReplies"
              );
            }
          }
          console.log("[instagram:webhook] response_tracked", {
            automationId: automation.id,
            type: "DM",
          });
          if (webhookEventId) {
            await markProcessedExternalEvent("INSTAGRAM", webhookEventId, "SUCCESS");
          }
          return NextResponse.json(
            {
              message: "Message sent",
            },
            { status: 200 }
          );
        }
      } catch (error) {
        if (automationUserId) {
          await logAutomationEvent({
            userId: automationUserId,
            automationId: automation.id,
            channel: "INSTAGRAM",
            triggerType: "DM",
            eventType: AUTOMATION_EVENT_TYPE.DELIVERY_FAILED,
            senderId: messaging?.sender?.id ?? null,
            status: AUTOMATION_EVENT_STATUS.ERROR,
            reason: "dm_send_failed",
          });
        }
        throw error;
      }

    }

    if (isCommentEvent) {
      const automation = await getKeywordAutomation(
        matcher.automationId,
        false,
        "INSTAGRAM"
      );
      const automationUserId = automation?.User?.id ?? accountIntegration?.userId;

      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: matcher.automationId,
          channel: "INSTAGRAM",
          triggerType: "COMMENT",
          eventType: AUTOMATION_EVENT_TYPE.KEYWORD_MATCHED,
          senderId: commentChange?.value?.from?.id ?? null,
          postId: mediaId,
          commentId,
          status: AUTOMATION_EVENT_STATUS.SUCCESS,
        });
      }

      console.log("[instagram:webhook] automation_lookup", {
        automationId: matcher.automationId,
        found: Boolean(automation),
        listener: automation?.listener?.listener ?? null,
        hasToken: Boolean(automation?.User?.integrations[0]?.token),
      });

      const automationPost = await getKeywordPost(
        commentChange?.value?.media?.id,
        automation?.id ?? ""
      );

      console.log("[instagram:webhook] comment_post_lookup", {
        automationId: automation?.id ?? null,
        mediaId,
        matchedPost: Boolean(automationPost),
      });

      if (
        !automation ||
        !automationPost ||
        !automation.listener ||
        automation.listener.listener !== "MESSAGE" ||
        !automation.User?.integrations[0]?.token
      ) {
        if (automationUserId) {
          await logAutomationEvent({
            userId: automationUserId,
            automationId: matcher.automationId,
            channel: "INSTAGRAM",
            triggerType: "COMMENT",
            eventType: AUTOMATION_EVENT_TYPE.IGNORED,
            senderId: commentChange?.value?.from?.id ?? null,
            postId: mediaId,
            commentId,
            status: AUTOMATION_EVENT_STATUS.INFO,
            reason: "missing_automation_post_listener_or_token_for_comment",
          });
        }
        console.log("[instagram:webhook] ignored_event", {
          reason: "missing_automation_post_listener_or_token_for_comment",
          automationId: matcher.automationId,
          commentId,
          mediaId,
        });
        return NextResponse.json(
          {
            message: "No automation set",
          },
          { status: 200 }
        );
      }

      const publicReply = automation.listener.commentReply?.trim();
      const privatePrompt = automation.listener.prompt?.trim();
      const token = automation.User.integrations[0].token;
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
      const commentAccess = ensurePackageRuntimeAccess(
        subscription,
        currentUsage,
        "instagramCommentReplies"
      );
      const dmAccess = ensurePackageRuntimeAccess(
        subscription,
        currentUsage,
        "instagramDmReplies"
      );

      if (!commentAccess.ok && !dmAccess.ok) {
        if (automationUserId) {
          await logAutomationEvent({
            userId: automationUserId,
            automationId: automation.id,
            channel: "INSTAGRAM",
            triggerType: "COMMENT",
            eventType: AUTOMATION_EVENT_TYPE.IGNORED,
            senderId: commentChange?.value?.from?.id ?? null,
            postId: mediaId,
            commentId,
            status: AUTOMATION_EVENT_STATUS.INFO,
            reason: commentAccess.message,
          });
        }
        return NextResponse.json({ message: "Delivery blocked" }, { status: 200 });
      }

      console.log("[instagram:webhook] comment_send_plan", {
        automationId: automation.id,
        commentId,
        hasPublicReply: Boolean(publicReply),
        hasPrivatePrompt: Boolean(privatePrompt),
      });

      let publicReplyStatus: number | null = null;
      if (commentId && publicReply && commentAccess.ok) {
        try {
          console.log("[instagram:webhook] send_attempt", {
            mode: "COMMENT_PUBLIC_REPLY",
            automationId: automation.id,
            commentId,
          });
          const commentReply = await sendInstagramCommentReply(
            commentId,
            publicReply,
            token
          );
          publicReplyStatus = commentReply.status;
          console.log("[instagram:webhook] send_result", {
            mode: "COMMENT_PUBLIC_REPLY",
            automationId: automation.id,
            status: commentReply.status,
          });
          if (commentReply.status === 200 && automationUserId) {
            await logAutomationEvent({
              userId: automationUserId,
              automationId: automation.id,
              channel: "INSTAGRAM",
              triggerType: "COMMENT",
              eventType: AUTOMATION_EVENT_TYPE.COMMENT_REPLY_SENT,
              senderId: commentChange?.value?.from?.id ?? null,
              postId: mediaId,
              commentId,
              status: AUTOMATION_EVENT_STATUS.SUCCESS,
            });
            if (currentPeriod) {
              await incrementBillingUsage(
                automationUserId,
                subscription?.id ?? null,
                currentPeriod.periodStart,
                currentPeriod.periodEnd,
                "instagramCommentReplies"
              );
            }
          }
        } catch (error) {
          if (automationUserId) {
            await logAutomationEvent({
              userId: automationUserId,
              automationId: automation.id,
              channel: "INSTAGRAM",
              triggerType: "COMMENT",
              eventType: AUTOMATION_EVENT_TYPE.DELIVERY_FAILED,
              senderId: commentChange?.value?.from?.id ?? null,
              postId: mediaId,
              commentId,
              status: AUTOMATION_EVENT_STATUS.ERROR,
              reason: "instagram_public_reply_failed",
            });
          }
          console.log("[instagram:webhook] public_reply_failed", {
            automationId: automation.id,
            commentId,
          });
        }
      }

      let privateReplyStatus: number | null = null;
      if (commentId && privatePrompt && dmAccess.ok) {
        try {
          console.log("[instagram:webhook] send_attempt", {
            mode: "COMMENT_PRIVATE_REPLY",
            automationId: automation.id,
            commentId,
          });
          const directMessage = await sendPrivateMessage(
            entry.id,
            commentId,
            privatePrompt,
            token
          );
          privateReplyStatus = directMessage.status;
          console.log("[instagram:webhook] send_result", {
            mode: "COMMENT_PRIVATE_REPLY",
            automationId: automation.id,
            status: directMessage.status,
          });
          if (directMessage.status === 200 && automationUserId) {
            await logAutomationEvent({
              userId: automationUserId,
              automationId: automation.id,
              channel: "INSTAGRAM",
              triggerType: "COMMENT",
              eventType: AUTOMATION_EVENT_TYPE.DM_REPLY_SENT,
              senderId: commentChange?.value?.from?.id ?? null,
              postId: mediaId,
              commentId,
              status: AUTOMATION_EVENT_STATUS.SUCCESS,
            });
            if (currentPeriod) {
              await incrementBillingUsage(
                automationUserId,
                subscription?.id ?? null,
                currentPeriod.periodStart,
                currentPeriod.periodEnd,
                "instagramDmReplies"
              );
            }
          }
        } catch (error) {
          if (automationUserId) {
            await logAutomationEvent({
              userId: automationUserId,
              automationId: automation.id,
              channel: "INSTAGRAM",
              triggerType: "COMMENT",
              eventType: AUTOMATION_EVENT_TYPE.DELIVERY_FAILED,
              senderId: commentChange?.value?.from?.id ?? null,
              postId: mediaId,
              commentId,
              status: AUTOMATION_EVENT_STATUS.ERROR,
              reason: "instagram_private_reply_failed",
            });
          }
          console.log("[instagram:webhook] private_reply_failed", {
            automationId: automation.id,
            commentId,
          });
        }
      }

      if (publicReplyStatus === 200 || privateReplyStatus === 200) {
        await trackResponses(automation.id, "COMMENT");
        console.log("[instagram:webhook] response_tracked", {
          automationId: automation.id,
          type: "COMMENT",
          publicReplyStatus,
          privateReplyStatus,
        });
        if (webhookEventId) {
          await markProcessedExternalEvent("INSTAGRAM", webhookEventId, "SUCCESS");
        }
        return NextResponse.json(
          {
            message:
              publicReplyStatus === 200 && privateReplyStatus === 200
                ? "Comment and private reply sent"
                : publicReplyStatus === 200
                  ? "Comment reply sent"
                  : "Private reply sent",
          },
          { status: 200 }
        );
      }

    }

    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
  } catch (error) {
    logSecurityEvent("webhook", "instagram_handler_error", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
  }
}
