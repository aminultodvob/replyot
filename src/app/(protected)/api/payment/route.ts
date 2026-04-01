import { createUddoktaPayCharge } from "@/lib/uddoktapay";
import { getSessionUser } from "@/lib/auth";
import { findUser } from "@/actions/user/queries";
import { recordPendingPaymentHistory } from "@/actions/user";
import { NextResponse } from "next/server";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export async function GET(req: Request) {
  const ip = getRequestIp(req.headers);
  const rateLimit = applyRateLimit({
    key: `payment:create:${ip}`,
    limit: 12,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    logSecurityEvent("payment", "create_charge_rate_limited", { ip });
    return NextResponse.json(
      { status: 429, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const sessionUser = await getSessionUser();

  if (!sessionUser?.id) {
    return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
  }

  const user = await findUser(sessionUser.id);

  if (!user) {
    return NextResponse.json({ status: 404 });
  }

  try {
    const session = await createUddoktaPayCharge({
      fullName:
        [user.firstname, user.lastname].filter(Boolean).join(" ") || "Customer",
      email: user.email,
      metadata: {
        user_id: user.id,
        plan: "PRO",
        source: "dashboard-upgrade",
      },
    });

    if (session.status && session.payment_url) {
      if (session.invoice_id) {
        await recordPendingPaymentHistory(user.id, session.invoice_id);
      }

      return NextResponse.json({
        status: 200,
        session_url: session.payment_url,
      });
    }

    return NextResponse.json({
      status: 400,
      error: session.message ?? "Unable to create payment",
    });
  } catch (error) {
    logSecurityEvent("payment", "create_charge_failed", {
      userId: user.id,
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ status: 500, error: "Unable to start payment" });
  }
}
