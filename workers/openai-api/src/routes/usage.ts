/**
 * Usage tracking and analytics endpoint
 */

import { Hono } from "hono";
import type { AppContext } from "../types/env";
import type { UsageEvent } from "../types/api";
import { createLogger } from "../utils/logger";

/**
 * Usage tracking router
 */
export const usage = new Hono<AppContext>();

/**
 * GET /v1/usage
 * Get usage statistics for the authenticated user
 */
usage.get("/", async (c) => {
  const userId = c.get("userId");
  const startDate =
    c.req.query("start_date") ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const endDate =
    c.req.query("end_date") || new Date().toISOString().split("T")[0];

  try {
    // Query usage data from database
    const usageData = await c.env.DB.prepare(
      `
      SELECT 
        DATE(created_at) as date,
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(input_tokens + output_tokens) as total_tokens,
        SUM(cost) as total_cost,
        AVG(latency) as avg_latency
      FROM usage_logs 
      WHERE user_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at), model
      ORDER BY created_at DESC, model
    `
    )
      .bind(userId, startDate, endDate)
      .all();

    // Calculate totals
    const totals = await c.env.DB.prepare(
      `
      SELECT 
        COUNT(*) as total_requests,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(input_tokens + output_tokens) as total_tokens,
        SUM(cost) as total_cost
      FROM usage_logs 
      WHERE user_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
    `
    )
      .bind(userId, startDate, endDate)
      .first();

    return c.json({
      object: "usage",
      start_date: startDate,
      end_date: endDate,
      totals: {
        requests: totals?.["total_requests"] || 0,
        input_tokens: totals?.["total_input_tokens"] || 0,
        output_tokens: totals?.["total_output_tokens"] || 0,
        total_tokens: totals?.["total_tokens"] || 0,
        cost: totals?.["total_cost"] || 0
      },
      daily_usage: usageData.results || []
    });
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Usage query error",
      error instanceof Error ? error : new Error(String(error))
    );

    return c.json(
      {
        error: {
          message: "Failed to fetch usage data",
          type: "internal_server_error",
          code: "usage_fetch_error"
        }
      },
      500
    );
  }
});

/**
 * GET /v1/usage/models
 * Get usage breakdown by model
 */
usage.get("/models", async (c) => {
  const userId = c.get("userId");
  const startDate =
    c.req.query("start_date") ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const endDate =
    c.req.query("end_date") || new Date().toISOString().split("T")[0];

  try {
    const modelUsage = await c.env.DB.prepare(
      `
      SELECT 
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(input_tokens + output_tokens) as total_tokens,
        SUM(cost) as total_cost,
        AVG(latency) as avg_latency,
        MIN(created_at) as first_used,
        MAX(created_at) as last_used
      FROM usage_logs 
      WHERE user_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY model
      ORDER BY total_cost DESC
    `
    )
      .bind(userId, startDate, endDate)
      .all();

    return c.json({
      object: "usage.models",
      start_date: startDate,
      end_date: endDate,
      models: modelUsage.results || []
    });
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Model usage query error",
      error instanceof Error ? error : new Error(String(error))
    );

    return c.json(
      {
        error: {
          message: "Failed to fetch model usage data",
          type: "internal_server_error",
          code: "model_usage_fetch_error"
        }
      },
      500
    );
  }
});

/**
 * POST /v1/usage/track
 * Internal endpoint for tracking usage (called by other routes)
 */
usage.post("/track", async (c) => {
  try {
    const usageEvent: UsageEvent = await c.req.json();

    // Store usage in database
    await c.env.DB.prepare(
      `
      INSERT INTO usage_logs (
        user_id, request_id, model, input_tokens, output_tokens, 
        cost, latency, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        usageEvent.userId,
        usageEvent.requestId,
        usageEvent.model,
        usageEvent.inputTokens,
        usageEvent.outputTokens,
        usageEvent.cost || 0,
        usageEvent.latency || 0,
        new Date().toISOString()
      )
      .run();

    // Track in PostHog if configured
    if (c.env.POSTHOG_API_KEY) {
      // TODO: Implement PostHog tracking
      const logger = createLogger({
        requestId: c.get("requestId"),
        userId: c.get("userId"),
        env: c.env
      });
      logger.info("PostHog tracking", { usageEvent });
    }

    return c.json({ success: true });
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Usage tracking error",
      error instanceof Error ? error : new Error(String(error))
    );

    return c.json(
      {
        error: {
          message: "Failed to track usage",
          type: "internal_server_error",
          code: "usage_tracking_error"
        }
      },
      500
    );
  }
});
