import {
  onWebhookSubscribe,
  recordPaymentHistoryStatus,
  recordPendingPaymentHistory,
} from "@/actions/user";
import {
  findProcessedExternalEvent,
  markProcessedExternalEvent,
} from "@/actions/user/queries";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { isValidUddoktaPayWebhook } from "@/lib/uddoktapay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const ip = getRequestIp(req.headers);
  const rateLimit = applyRateLimit({
    key: `webhook:uddoktapay:${ip}`,
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    logSecurityEvent("webhook", "uddoktapay_rate_limited", { ip });
    return NextResponse.json({ status: false, message: "Too many requests" }, { status: 429 });
  }

  const apiKeyHeader = req.headers.get("RT-UDDOKTAPAY-API-KEY");

  if (!isValidUddoktaPayWebhook(apiKeyHeader)) {
    logSecurityEvent("webhook", "uddoktapay_invalid_signature", { ip });
    return NextResponse.json({ status: false, message: "Invalid webhook signature" }, { status: 401 });
  }

  const payload = (await req.json()) as {
    invoice_id?: string;
    status?: string;
    transaction_id?: string;
    amount?: string | number;
    currency?: string;
    metadata?: {
      user_id?: string;
    };
  };

  const invoiceId = payload.invoice_id;
  const userId = payload.metadata?.user_id;
  const normalizedStatus = payload.status?.trim().toUpperCase() ?? "PAID";
  const eventKey = `${invoiceId}:${normalizedStatus}`;

  if (!invoiceId || !userId) {
    logSecurityEvent("webhook", "uddoktapay_missing_fields", {
      ip,
      hasInvoiceId: Boolean(invoiceId),
      hasUserId: Boolean(userId),
    });
    return NextResponse.json({ status: false, message: "Missing invoice payload" }, { status: 400 });
  }

  const existingEvent = await findProcessedExternalEvent("UDDOKTAPAY", eventKey);
  if (existingEvent) {
    return NextResponse.json({ status: true, message: "Already processed" });
  }

  await recordPendingPaymentHistory(userId, invoiceId, payload.transaction_id ?? null);

  if (normalizedStatus !== "PAID" && normalizedStatus !== "COMPLETED") {
    await recordPaymentHistoryStatus(userId, invoiceId, normalizedStatus, {
      externalPaymentId: payload.transaction_id ?? null,
      amount: payload.amount,
      currency: payload.currency,
    });
    await markProcessedExternalEvent("UDDOKTAPAY", eventKey, normalizedStatus);
    return NextResponse.json({ status: true, message: "Payment status recorded" });
  }

  const settled = await onWebhookSubscribe(userId, invoiceId);

  if (settled.status !== 200) {
    logSecurityEvent("webhook", "uddoktapay_settlement_failed", {
      ip,
      status: settled.status,
      userId,
    });
    return NextResponse.json(
      { status: false, message: settled.error ?? "Unable to settle payment" },
      { status: settled.status >= 400 ? settled.status : 400 }
    );
  }

  await markProcessedExternalEvent("UDDOKTAPAY", eventKey, "SUCCESS");
  return NextResponse.json({ status: true, message: "Payment processed" });
}
