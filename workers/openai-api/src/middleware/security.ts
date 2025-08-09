/**
 * Security middleware for setting security headers and basic protection
 */

import { createMiddleware } from "hono/factory";
import type { Env } from "../types/env";

/**
 * Security headers middleware
 * Adds essential security headers to all responses
 */
export const securityHeaders = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    await next();

    // Prevent MIME type sniffing
    c.header("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    c.header("X-Frame-Options", "DENY");

    // XSS protection (legacy but still useful)
    c.header("X-XSS-Protection", "1; mode=block");

    // Referrer policy
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");

    // Content Security Policy
    c.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
    );

    // Strict Transport Security (HTTPS only)
    c.header(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );

    // Remove server information
    c.header("Server", "WeMake-API");
  }
);

/**
 * Input sanitization utility
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;"
      };
      return entities[match] || match;
    })
    .trim();
}

/**
 * Validate request size
 * Prevents oversized requests that could cause DoS
 */
export function validateRequestSize(
  contentLength: string | null,
  maxSize: number = 1024 * 1024
): boolean {
  if (!contentLength) {
    return true; // Allow requests without content-length header
  }

  const size = parseInt(contentLength, 10);
  return !isNaN(size) && size <= maxSize;
}

/**
 * Rate limiting key generator
 * Creates consistent keys for rate limiting based on user ID or IP
 */
export function generateRateLimitKey(userId?: string, ip?: string): string {
  if (userId) {
    return `rate_limit:user:${userId}`;
  }

  if (ip) {
    return `rate_limit:ip:${ip}`;
  }

  return "rate_limit:anonymous";
}
