import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

const handler = NextAuth(authOptions);

type NextAuthRouteContext = {
  params: {
    nextauth: string[];
  };
};

export async function GET(req: Request, ctx: NextAuthRouteContext) {
  return await handler(req, ctx);
}

export async function POST(req: Request, ctx: NextAuthRouteContext) {
  const ip = getRequestIp(req.headers);
  const rateLimit = applyRateLimit({
    key: `auth:nextauth:${ip}`,
    limit: 25,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    logSecurityEvent("auth", "nextauth_rate_limited", { ip });
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  return await handler(req, ctx);
}
