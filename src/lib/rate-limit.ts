type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options: { windowMs: number; max: number },
) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { ok: true, remaining: options.max - 1, resetAt: now + options.windowMs };
  }

  if (existing.count >= options.max) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    ok: true,
    remaining: Math.max(0, options.max - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown-ip";
  return ip;
}
