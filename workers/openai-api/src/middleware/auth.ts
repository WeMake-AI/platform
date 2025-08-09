/**
 * Authentication middleware for API key validation
 */

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppContext } from "../types/env";

/**
 * Authentication middleware
 * Validates API keys and sets user context
 */
export const auth = createMiddleware<AppContext>(async (c, next) => {
  const authorization = c.req.header("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new HTTPException(401, {
      message: "Missing or invalid authorization header",
      res: new Response(
        JSON.stringify({
          error: {
            message:
              "You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY).",
            type: "invalid_request_error",
            code: "missing_api_key"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    });
  }

  const apiKey = authorization.slice(7); // Remove 'Bearer ' prefix

  try {
    // Validate API key against database
    const keyRecord = await c.env.DB.prepare(
      `SELECT user_id, permissions, rate_limit, is_active 
       FROM api_keys 
       WHERE key_hash = ? AND is_active = TRUE`
    )
      .bind(await hashApiKey(apiKey))
      .first();

    if (!keyRecord) {
      throw new HTTPException(401, {
        message: "Invalid API key",
        res: new Response(
          JSON.stringify({
            error: {
              message:
                "Incorrect API key provided. You can find your API key at https://platform.openai.com/account/api-keys.",
              type: "invalid_request_error",
              code: "invalid_api_key"
            }
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" }
          }
        )
      });
    }

    // Update last used timestamp
    await c.env.DB.prepare(
      "UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_hash = ?"
    )
      .bind(await hashApiKey(apiKey))
      .run();

    // Set user context for downstream middleware
    c.set("userId", keyRecord["user_id"] as string);
    c.set("permissions", (keyRecord["permissions"] as string).split(","));
    c.set("rateLimit", keyRecord["rate_limit"] as number);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error("Authentication error:", error);
    throw new HTTPException(500, {
      message: "Internal authentication error",
      res: new Response(
        JSON.stringify({
          error: {
            message: "Internal server error during authentication",
            type: "internal_server_error",
            code: "auth_error"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    });
  }
});

/**
 * Hash API key using SHA-256
 * Provides secure storage of API keys in the database
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a new API key
 * Creates a cryptographically secure random API key
 */
export function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `sk-${Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Validate API key format
 * Ensures API key follows expected format
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // OpenAI-style API keys start with 'sk-' and are followed by 48 hex characters
  const apiKeyRegex = /^sk-[a-f0-9]{48}$/;
  return apiKeyRegex.test(apiKey);
}
