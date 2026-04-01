export type UxEventName =
  | "onboarding_step_completed"
  | "payment_cta_clicked"
  | "automation_created"
  | "automation_activated"
  | "quota_warning_seen";

export const trackUxEvent = (
  event: UxEventName,
  metadata: Record<string, string | number | boolean | null> = {}
) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    event,
    metadata,
    at: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/ux", blob);
    return;
  }

  void fetch("/api/analytics/ux", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  });
};
