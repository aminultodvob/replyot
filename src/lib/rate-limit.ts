type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __rate_limit_state__: Map<string, RateLimitState> | undefined;
}

const state = globalThis.__rate_limit_state__ ?? new Map<string, RateLimitState>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__rate_limit_state__ = state;
}

export const applyRateLimit = ({
  key,
  limit,
  windowMs,
}: RateLimitConfig) => {
  const now = Date.now();
  const current = state.get(key);

  if (!current || current.resetAt <= now) {
    const next: RateLimitState = {
      count: 1,
      resetAt: now + windowMs,
    };
    state.set(key, next);
    return {
      ok: true as const,
      remaining: Math.max(limit - 1, 0),
      resetAt: next.resetAt,
    };
  }

  current.count += 1;
  state.set(key, current);

  if (current.count > limit) {
    return {
      ok: false as const,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  return {
    ok: true as const,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
  };
};

type HeaderInput = Headers | Record<string, string | string[] | undefined>;

const readHeader = (headers: HeaderInput, name: string) => {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export const getRequestIp = (headers: HeaderInput) => {
  const forwardedFor = readHeader(headers, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return readHeader(headers, "x-real-ip") ?? "unknown";
};
