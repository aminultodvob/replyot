import { NextResponse } from "next/server";

import { resetPasswordWithToken } from "@/lib/auth";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req.headers);
    const rateLimit = applyRateLimit({
      key: `auth:reset-password:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      logSecurityEvent("auth", "reset_password_rate_limited", { ip });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      token: string;
      password: string;
      confirmPassword: string;
    };
    const result = await resetPasswordWithToken(body);

    return NextResponse.json(
      {
        ...(result.error ? { error: result.error } : { data: result.data }),
      },
      { status: result.status }
    );
  } catch (error) {
    console.log("[auth/reset-password] failed", error);
    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    );
  }
}
