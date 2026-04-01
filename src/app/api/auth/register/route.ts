import { NextResponse } from "next/server";

import { signUpWithPassword } from "@/lib/auth";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req.headers);
    const rateLimit = applyRateLimit({
      key: `auth:register:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      logSecurityEvent("auth", "register_rate_limited", { ip });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      firstname: string;
      lastname: string;
      email: string;
      password: string;
      confirmPassword: string;
    };

    const result = await signUpWithPassword(body);

    if (result.status !== 201) {
      return NextResponse.json(
        {
          error: result.error,
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("[auth/register] failed", error);
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 500 }
    );
  }
}
