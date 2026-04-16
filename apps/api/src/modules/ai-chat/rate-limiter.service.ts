import { Injectable } from "@nestjs/common";

interface UsageRecord {
  count: number;
  resetAt: number; // epoch ms — midnight next day
}

@Injectable()
export class AiChatRateLimiter {
  private usage = new Map<string, UsageRecord>();

  // Limits per day
  private readonly LIMITS = {
    guest: 10,
    user: 100,
    admin: Infinity,
  };

  private getNextMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }

  private getKey(userId: string | null, ip: string): string {
    return userId ? `user:${userId}` : `guest:${ip}`;
  }

  /**
   * Check if request is allowed. Returns { allowed, remaining, limit, resetAt }
   */
  check(
    userId: string | null,
    role: string | null,
    ip: string,
  ): { allowed: boolean; remaining: number; limit: number; resetAt: number } {
    const key = this.getKey(userId, ip);
    const now = Date.now();

    // Determine limit based on role
    let limit: number;
    if (role === "admin") limit = this.LIMITS.admin;
    else if (userId) limit = this.LIMITS.user;
    else limit = this.LIMITS.guest;

    let record = this.usage.get(key);

    // Reset if expired or first request
    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: this.getNextMidnight() };
      this.usage.set(key, record);
    }

    const allowed = record.count < limit;
    const remaining = Math.max(0, limit - record.count);

    return {
      allowed,
      remaining,
      limit: limit === Infinity ? -1 : limit,
      resetAt: record.resetAt,
    };
  }

  /**
   * Increment usage count. Call this after check() passes and request succeeds.
   */
  increment(userId: string | null, ip: string): void {
    const key = this.getKey(userId, ip);
    const record = this.usage.get(key);
    if (record) {
      record.count += 1;
    }
  }

  /**
   * Get current usage without incrementing (for the /quota endpoint)
   */
  getUsage(
    userId: string | null,
    role: string | null,
    ip: string,
  ): { used: number; remaining: number; limit: number; resetAt: number } {
    const key = this.getKey(userId, ip);
    const now = Date.now();

    let limit: number;
    if (role === "admin") limit = this.LIMITS.admin;
    else if (userId) limit = this.LIMITS.user;
    else limit = this.LIMITS.guest;

    const record = this.usage.get(key);
    if (!record || now >= record.resetAt) {
      return {
        used: 0,
        remaining: limit === Infinity ? -1 : limit,
        limit: limit === Infinity ? -1 : limit,
        resetAt: this.getNextMidnight(),
      };
    }

    return {
      used: record.count,
      remaining: limit === Infinity ? -1 : Math.max(0, limit - record.count),
      limit: limit === Infinity ? -1 : limit,
      resetAt: record.resetAt,
    };
  }

  /**
   * Cleanup expired records every hour to prevent memory leak
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.usage.entries()) {
      if (now >= record.resetAt) {
        this.usage.delete(key);
      }
    }
  }
}
