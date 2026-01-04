const attemptLog = new Map<string, number[]>();

export function isRateLimited(key: string, limit = 10, windowMs = 5 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const previous = attemptLog.get(key)?.filter((timestamp) => timestamp >= windowStart) ?? [];
  const nextAttempts = [...previous, now];
  attemptLog.set(key, nextAttempts);
  return nextAttempts.length > limit;
}
