import {
  getCurrentBillingUsage,
  getKeywordAutomation,
  getWhatsAppPhoneIntegration,
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
import { sendWhatsAppTextMessage } from "@/lib/fetch";
import { AUTOMATION_EVENT_STATUS, AUTOMATION_EVENT_TYPE } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { ensurePackageRuntimeAccess } from "@/lib/billing-access";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  const expectedToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? process.env.WEBHOOK_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    challenge &&
    token &&
    expectedToken &&
    token === expectedToken
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { message: "Webhook verification failed" },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req.headers);
  const rateLimit = applyRateLimit({
    key: `webhook:whatsapp:${ip}`,
    limit: 240,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    logSecurityEvent("webhook", "whatsapp_rate_limited", { ip });
    return NextResponse.json({ message: "Event ignored" }, { status: 429 });
  }

  const payload = await req.json();

  try {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];
    const messageId =
      typeof message?.id === "string" && message.id ? message.id : null;
    const phoneNumberId =
      typeof value?.metadata?.phone_number_id === "string"
        ? value.metadata.phone_number_id
        : null;
    const senderId =
      typeof message?.from === "string"
        ? message.from
        : typeof contact?.wa_id === "string"
          ? contact.wa_id
          : null;
    const textBody =
      typeof message?.text?.body === "string" ? message.text.body.trim() : "";

    logSecurityEvent("webhook", "whatsapp_event_received", {
      phoneNumberId,
      messageId,
      senderId,
      hasText: Boolean(textBody),
    });

    if (messageId) {
      const processed = await findProcessedExternalEvent("WHATSAPP", messageId);
      if (processed) {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }
    }

    if (payload?.object !== "whatsapp_business_account" || !phoneNumberId) {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const phoneIntegration = await getWhatsAppPhoneIntegration(phoneNumberId);

    if (phoneIntegration?.userId) {
      await logAutomationEvent({
        userId: phoneIntegration.userId,
        channel: "WHATSAPP",
        triggerType: "DM",
        eventType: AUTOMATION_EVENT_TYPE.DM_RECEIVED,
        senderId,
        status: AUTOMATION_EVENT_STATUS.INFO,
      });
    }

    if (!textBody) {
      if (phoneIntegration?.userId) {
        await logAutomationEvent({
          userId: phoneIntegration.userId,
          channel: "WHATSAPP",
          triggerType: "DM",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "missing_text_body",
        });
      }
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const matcher = await matchKeyword(textBody, "WHATSAPP", "DM");

    if (!matcher?.automationId) {
      if (phoneIntegration?.userId) {
        await logAutomationEvent({
          userId: phoneIntegration.userId,
          channel: "WHATSAPP",
          triggerType: "DM",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "keyword_not_matched",
        });
      }
      return NextResponse.json({ message: "No automation set" }, { status: 200 });
    }

    const automation = await getKeywordAutomation(matcher.automationId, true, "WHATSAPP");
    const automationUserId = automation?.User?.id ?? phoneIntegration?.userId ?? null;

    if (automationUserId) {
      await logAutomationEvent({
        userId: automationUserId,
        automationId: matcher.automationId,
        channel: "WHATSAPP",
        triggerType: "DM",
        eventType: AUTOMATION_EVENT_TYPE.KEYWORD_MATCHED,
        senderId,
        status: AUTOMATION_EVENT_STATUS.SUCCESS,
      });
    }

    const integration = automation?.User?.integrations?.[0];

    if (
      !automation?.listener ||
      automation.listener.listener !== "MESSAGE" ||
      !integration?.token ||
      !integration.whatsappPhoneNumberId ||
      !senderId
    ) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: matcher.automationId,
          channel: "WHATSAPP",
          triggerType: "DM",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: "missing_listener_or_whatsapp_connection",
        });
      }
      return NextResponse.json({ message: "No automation set" }, { status: 200 });
    }

    const subscription = automation.User?.subscription;
    const currentPeriod = getCurrentBillingPeriodBounds(subscription);
    const currentUsage =
      automationUserId && currentPeriod
        ? await getCurrentBillingUsage(
            automationUserId,
            currentPeriod.periodStart,
            currentPeriod.periodEnd
          )
        : null;
    const deliveryAccess = ensurePackageRuntimeAccess(
      subscription,
      currentUsage,
      "whatsappMessagesSent"
    );

    if (!deliveryAccess.ok) {
      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "WHATSAPP",
          triggerType: "DM",
          eventType: AUTOMATION_EVENT_TYPE.IGNORED,
          senderId,
          status: AUTOMATION_EVENT_STATUS.INFO,
          reason: deliveryAccess.message,
        });
      }
      return NextResponse.json({ message: "Delivery blocked" }, { status: 200 });
    }

    const prompt = automation.listener.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ message: "No automation set" }, { status: 200 });
    }

    const sendResult = await sendWhatsAppTextMessage(
      integration.whatsappPhoneNumberId,
      senderId,
      prompt,
      integration.token
    );

    if (sendResult.status === 200) {
      await trackResponses(automation.id, "DM");

      if (automationUserId) {
        await logAutomationEvent({
          userId: automationUserId,
          automationId: automation.id,
          channel: "WHATSAPP",
          triggerType: "DM",
          eventType: AUTOMATION_EVENT_TYPE.DM_REPLY_SENT,
          senderId,
          status: AUTOMATION_EVENT_STATUS.SUCCESS,
        });

        if (currentPeriod) {
          await incrementBillingUsage(
            automationUserId,
            subscription?.id ?? null,
            currentPeriod.periodStart,
            currentPeriod.periodEnd,
            "whatsappMessagesSent"
          );
        }
      }

      if (messageId) {
        await markProcessedExternalEvent("WHATSAPP", messageId, "SUCCESS");
      }

      return NextResponse.json({ message: "Message sent" }, { status: 200 });
    }

    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  } catch (error) {
    logSecurityEvent("webhook", "whatsapp_handler_error", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  }
}
