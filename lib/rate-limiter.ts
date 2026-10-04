export interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private records = new Map<string, ClientRecord>();
  private windowMs: number;
  private max: number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    const existing = this.records.get(key);

    if (!existing || now >= existing.resetAt) {
      const resetAt = now + this.windowMs;
      this.records.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.max - 1,
        resetAt,
      };
    }

    if (existing.count < this.max) {
      existing.count += 1;
      return {
        allowed: true,
        remaining: this.max - existing.count,
        resetAt: existing.resetAt,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  public reset(key: string): void {
    this.records.delete(key);
  }

  public pruneStale(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetAt) {
        this.records.delete(key);
      }
    }
  }
}

/**
 * Extract client IP from standard Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  return "127.0.0.1";
}

// Global limiters for auth endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 attempts per minute
});

export const registerRateLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,                   // 5 signups per 10 minutes per IP
});
