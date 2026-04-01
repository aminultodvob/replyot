import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/lib/auth";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req.headers);
    const rateLimit = applyRateLimit({
      key: `auth:forgot-password:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      logSecurityEvent("auth", "forgot_password_rate_limited", { ip });
      return NextResponse.json(
        { data: "If an account exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    const body = (await req.json()) as { email: string };
    const result = await requestPasswordReset(body);

    return NextResponse.json(
      {
        data: result.data,
      },
      { status: result.status }
    );
  } catch (error) {
    console.log("[auth/forgot-password] failed", error);
    return NextResponse.json(
      { error: "Unable to process request" },
      { status: 500 }
    );
  }
}
