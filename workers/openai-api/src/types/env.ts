/**
 * Environment bindings and configuration types for Cloudflare Workers
 */

/**
 * Cloudflare Workers environment bindings
 * These are injected by the Cloudflare Workers runtime
 */
export interface Env {
  // Database bindings
  DB: D1Database;

  // KV namespace bindings
  RATE_LIMITER: KVNamespace;
  CACHE: KVNamespace;

  // Environment variables
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_BASE_URL?: string;
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
  ALLOWED_ORIGINS?: string;

  // Rate limiting configuration
  RATE_LIMIT_PER_MINUTE?: string;
  RATE_LIMIT_PER_HOUR?: string;
  RATE_LIMIT_PER_DAY?: string;

  // API configuration
  MAX_REQUEST_SIZE?: string;
  DEFAULT_TEMPERATURE?: string;
  CACHE_TTL?: string;
  MAX_TOKENS_DEFAULT?: string;
  DEFAULT_MODEL?: string;

  // Security
  JWT_SECRET?: string;
  API_KEY_SALT?: string;

  // Optional AI Gateway binding
  AI_GATEWAY?: {
    gateway: {
      id: string;
      name: string;
    };
  };
}

/**
 * Context variables that can be set and retrieved in Hono context
 */
export interface Variables {
  requestId: string;
  userId?: string;
  permissions?: string[];
  rateLimit?: number;
}

/**
 * User context set by authentication middleware
 */
export interface UserContext {
  userId: string;
  permissions: string[];
  rateLimit: number;
}

/**
 * Extended Hono context with user information
 */
export interface AppContext {
  Bindings: Env;
  Variables: Variables;
}
