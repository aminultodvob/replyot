import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security-log";

const allowedEvents = new Set([
  "onboarding_step_completed",
  "payment_cta_clicked",
  "automation_created",
  "automation_activated",
  "quota_warning_seen",
]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      event?: string;
      metadata?: Record<string, unknown>;
      at?: string;
    };

    if (!body?.event || !allowedEvents.has(body.event)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    logSecurityEvent("ux", body.event, {
      ...(body.metadata ?? {}),
      at: body.at ?? null,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
