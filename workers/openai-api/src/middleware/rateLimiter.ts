/**
 * Rate limiting middleware using Cloudflare KV storage
 */

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppContext } from "../types/env";
import { createLogger } from "../utils/logger";

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (c: Context<AppContext>) => string; // Custom key generator
}

/**
 * Rate limiting middleware
 * Implements sliding window rate limiting using Cloudflare KV
 */
export const rateLimiter = createMiddleware<AppContext>(async (c, next) => {
  const userId = c.get("userId");
  const userRateLimit =
    c.get("rateLimit") || parseInt(c.env.RATE_LIMIT_PER_MINUTE || "60", 10);
  const windowMs = 60 * 1000; // 1 minute window
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs);

  // Generate rate limit key
  const rateLimitKey = `rate_limit:${userId}:${windowStart}`;

  try {
    // Get current request count for this window
    const currentCountStr = await c.env.CACHE.get(rateLimitKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    // Check if rate limit exceeded
    if (currentCount >= userRateLimit) {
      const resetTime = (windowStart + 1) * windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      throw new HTTPException(429, {
        message: "Rate limit exceeded",
        res: new Response(
          JSON.stringify({
            error: {
              message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
              type: "rate_limit_exceeded",
              code: "rate_limit_exceeded"
            }
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": userRateLimit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
              "Retry-After": retryAfter.toString()
            }
          }
        )
      });
    }

    // Increment request count
    const newCount = currentCount + 1;
    await c.env.CACHE.put(rateLimitKey, newCount.toString(), {
      expirationTtl: Math.ceil(windowMs / 1000) + 10 // Add buffer for cleanup
    });

    // Set rate limit headers
    const remaining = Math.max(0, userRateLimit - newCount);
    const resetTime = (windowStart + 1) * windowMs;

    c.header("X-RateLimit-Limit", userRateLimit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Rate limiting error",
      error instanceof Error ? error : new Error(String(error))
    );
    // If rate limiting fails, allow the request to proceed
    // This prevents rate limiting issues from blocking all traffic
    await next();
  }
});

/**
 * Advanced rate limiter with multiple windows
 * Supports different rate limits for different time windows
 */
export function createAdvancedRateLimiter(
  configs: RateLimitConfig[]
): ReturnType<typeof createMiddleware<AppContext>> {
  return createMiddleware<AppContext>(async (c, next) => {
    const userId = c.get("userId") || "anonymous";
    const now = Date.now();

    // Check all rate limit windows
    for (const config of configs) {
      const windowStart = Math.floor(now / config.windowMs);
      const key = config.keyGenerator
        ? config.keyGenerator(c)
        : `rate_limit:${userId}:${config.windowMs}:${windowStart}`;

      const currentCountStr = await c.env.CACHE.get(key);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

      if (currentCount >= config.maxRequests) {
        const resetTime = (windowStart + 1) * config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        throw new HTTPException(429, {
          message: `Rate limit exceeded for ${config.windowMs}ms window`,
          res: new Response(
            JSON.stringify({
              error: {
                message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
                type: "rate_limit_exceeded",
                code: "rate_limit_exceeded"
              }
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": retryAfter.toString()
              }
            }
          )
        });
      }

      // Increment counter for this window
      await c.env.CACHE.put(key, (currentCount + 1).toString(), {
        expirationTtl: Math.ceil(config.windowMs / 1000) + 10
      });
    }

    await next();
  });
}

/**
 * IP-based rate limiter for unauthenticated requests
 */
export const ipRateLimiter = createMiddleware<AppContext>(async (c, next) => {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For") ||
    "unknown";
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // Lower limit for unauthenticated requests
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs);

  const rateLimitKey = `rate_limit:ip:${ip}:${windowStart}`;

  try {
    const currentCountStr = await c.env.CACHE.get(rateLimitKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    if (currentCount >= maxRequests) {
      throw new HTTPException(429, {
        message: "IP rate limit exceeded"
      });
    }

    await c.env.CACHE.put(rateLimitKey, (currentCount + 1).toString(), {
      expirationTtl: Math.ceil(windowMs / 1000) + 10
    });

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "IP rate limiting error",
      error instanceof Error ? error : new Error(String(error))
    );
    await next();
  }
});
