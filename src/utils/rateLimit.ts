const attempts = new Map<string, number[]>();

export function rateLimitByIp(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const prev = attempts.get(ip)?.filter((timestamp) => timestamp > windowStart) ?? [];

  if (prev.length >= limit) {
    attempts.set(ip, prev);
    return false;
  }

  attempts.set(ip, [...prev, now]);
  return true;
}
