type SecurityMeta = Record<string, string | number | boolean | null | undefined>;

const redact = (key: string, value: unknown) => {
  const lower = key.toLowerCase();
  if (
    lower.includes("token") ||
    lower.includes("secret") ||
    lower.includes("password") ||
    lower.includes("email") ||
    lower.includes("message")
  ) {
    return "[redacted]";
  }

  return value;
};

const sanitizeMeta = (meta?: SecurityMeta) => {
  if (!meta) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [key, redact(key, value)])
  );
};

export const logSecurityEvent = (
  area: string,
  event: string,
  meta?: SecurityMeta
) => {
  console.log(`[security:${area}] ${event}`, sanitizeMeta(meta));
};
