/**
 * PostHog integration for LLM observability and analytics
 */

import type { Env } from "../types/env";
import type { UsageEvent } from "../types/api";

/**
 * PostHog properties type - allows primitive values and nested objects
 */
export type PostHogProperties = Record<string, unknown>;

/**
 * LLM event interface for PostHog tracking
 */
export interface LLMEvent {
  event: string;
  distinctId: string;
  properties: PostHogProperties;
  timestamp?: string;
}

/**
 * PostHog client for Cloudflare Workers
 */
export class PostHogClient {
  private apiKey: string;
  private host: string;

  constructor(apiKey: string, host: string = "https://app.posthog.com") {
    this.apiKey = apiKey;
    this.host = host.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Track an event in PostHog
   */
  async track(event: LLMEvent): Promise<void> {
    try {
      const payload = {
        api_key: this.apiKey,
        event: event.event,
        distinct_id: event.distinctId,
        properties: {
          ...event.properties,
          timestamp: event.timestamp || new Date().toISOString(),
          $lib: "cloudflare-worker",
          $lib_version: "1.0.0"
        }
      };

      const response = await fetch(`${this.host}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WeMake-OpenAI-API/1.0"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(
          "PostHog tracking failed:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("PostHog tracking error:", error);
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackBatch(events: LLMEvent[]): Promise<void> {
    try {
      const payload = {
        api_key: this.apiKey,
        batch: events.map((event) => ({
          event: event.event,
          distinct_id: event.distinctId,
          properties: {
            ...event.properties,
            timestamp: event.timestamp || new Date().toISOString(),
            $lib: "cloudflare-worker",
            $lib_version: "1.0.0"
          }
        }))
      };

      const response = await fetch(`${this.host}/batch/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WeMake-OpenAI-API/1.0"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(
          "PostHog batch tracking failed:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("PostHog batch tracking error:", error);
    }
  }

  /**
   * Identify a user with properties
   */
  async identify(
    distinctId: string,
    properties: PostHogProperties
  ): Promise<void> {
    await this.track({
      event: "$identify",
      distinctId,
      properties: {
        $set: properties
      }
    });
  }
}

/**
 * Create PostHog client from environment
 */
export function createPostHogClient(env: Env): PostHogClient | null {
  if (!env.POSTHOG_API_KEY) {
    return null;
  }

  return new PostHogClient(
    env.POSTHOG_API_KEY,
    env.POSTHOG_HOST || "https://app.posthog.com"
  );
}

/**
 * Track LLM completion event
 */
export async function trackCompletion(
  client: PostHogClient | null,
  userId: string,
  data: {
    requestId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latency: number;
    cost?: number;
    success: boolean;
    errorType?: string;
  }
): Promise<void> {
  if (!client) return;

  await client.track({
    event: "llm_completion",
    distinctId: userId,
    properties: {
      request_id: data.requestId,
      model: data.model,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      total_tokens: data.inputTokens + data.outputTokens,
      latency_ms: data.latency,
      cost_usd: data.cost || 0,
      success: data.success,
      error_type: data.errorType,
      provider: "openrouter"
    }
  });
}

/**
 * Track API usage event
 */
export async function trackUsage(
  client: PostHogClient | null,
  userId: string,
  usageEvent: UsageEvent
): Promise<void> {
  if (!client) return;

  await client.track({
    event: "api_usage",
    distinctId: userId,
    properties: {
      request_id: usageEvent.requestId,
      model: usageEvent.model,
      input_tokens: usageEvent.inputTokens,
      output_tokens: usageEvent.outputTokens,
      total_tokens: usageEvent.inputTokens + usageEvent.outputTokens,
      latency_ms: usageEvent.latency,
      cost_usd: usageEvent.cost || 0
    }
  });
}

/**
 * Track authentication event
 */
export async function trackAuth(
  client: PostHogClient | null,
  userId: string,
  data: {
    success: boolean;
    method: string;
    errorType?: string;
  }
): Promise<void> {
  if (!client) return;

  await client.track({
    event: "api_auth",
    distinctId: userId,
    properties: {
      success: data.success,
      method: data.method,
      error_type: data.errorType
    }
  });
}

/**
 * Track rate limit event
 */
export async function trackRateLimit(
  client: PostHogClient | null,
  userId: string,
  data: {
    endpoint: string;
    limit: number;
    remaining: number;
    resetTime: number;
  }
): Promise<void> {
  if (!client) return;

  await client.track({
    event: "rate_limit_hit",
    distinctId: userId,
    properties: {
      endpoint: data.endpoint,
      limit: data.limit,
      remaining: data.remaining,
      reset_time: data.resetTime
    }
  });
}

/**
 * Track error event
 */
export async function trackError(
  client: PostHogClient | null,
  userId: string,
  data: {
    error: string;
    endpoint: string;
    statusCode: number;
    requestId?: string;
  }
): Promise<void> {
  if (!client) return;

  await client.track({
    event: "api_error",
    distinctId: userId || "anonymous",
    properties: {
      error: data.error,
      endpoint: data.endpoint,
      status_code: data.statusCode,
      request_id: data.requestId
    }
  });
}
