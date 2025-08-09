/**
 * Health check endpoint for system monitoring
 */

import { Hono } from "hono";
import type { AppContext } from "../types/env";
import type { HealthResponse } from "../types/api";
import { createLogger } from "../utils/logger";

/**
 * Health check result interface
 */
interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  responseTime?: number;
  error?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * Health check router
 */
export const health = new Hono<AppContext>();

/**
 * GET /health
 * Basic health check endpoint
 */
health.get("/", async (c) => {
  const startTime = Date.now();

  try {
    // Test database connectivity
    const dbTest = await c.env.DB.prepare("SELECT 1 as test").first();

    // Test KV connectivity
    const kvTestKey = `health_check_${Date.now()}`;
    await c.env.CACHE.put(kvTestKey, "test", { expirationTtl: 10 });
    const kvTest = await c.env.CACHE.get(kvTestKey);

    const responseTime = Date.now() - startTime;

    const response: HealthResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: responseTime
    };

    // Add service checks
    const checks = {
      database: dbTest ? "healthy" : "unhealthy",
      cache: kvTest === "test" ? "healthy" : "unhealthy",
      responseTime: `${responseTime}ms`
    };

    return c.json({
      ...response,
      checks
    });
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Health check failed",
      error instanceof Error ? error : new Error(String(error))
    );

    const response: HealthResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime
    };

    return c.json(response, 503);
  }
});

/**
 * GET /health/detailed
 * Detailed health check with service dependencies
 */
health.get("/detailed", async (c) => {
  const startTime = Date.now();
  const checks: Record<string, HealthCheckResult> = {};

  try {
    // Database health check
    try {
      const dbStart = Date.now();
      await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
      ).first();
      checks["database"] = {
        status: "healthy",
        responseTime: Date.now() - dbStart
      };
    } catch (error) {
      checks["database"] = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // KV storage health check
    try {
      const kvStart = Date.now();
      const testKey = `health_detailed_${Date.now()}`;
      await c.env.CACHE.put(testKey, "test", { expirationTtl: 10 });
      const result = await c.env.CACHE.get(testKey);
      await c.env.CACHE.delete(testKey);

      checks["cache"] = {
        status: result === "test" ? "healthy" : "unhealthy",
        responseTime: Date.now() - kvStart
      };
    } catch (error) {
      checks["cache"] = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // OpenRouter API health check (optional)
    if (c.env.OPENROUTER_API_KEY) {
      try {
        const openrouterStart = Date.now();
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${c.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://wemake.cx",
            "X-Title": "WeMake AI Platform"
          }
        });

        checks["openrouter"] = {
          status: response.ok ? "healthy" : "unhealthy",
          responseTime: Date.now() - openrouterStart,
          statusCode: response.status
        };
      } catch (error) {
        checks["openrouter"] = {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }

    // PostHog health check (optional)
    if (c.env.POSTHOG_API_KEY && c.env.POSTHOG_HOST) {
      try {
        const posthogStart = Date.now();
        const response = await fetch(
          `${c.env.POSTHOG_HOST}/api/projects/@current/`,
          {
            headers: {
              Authorization: `Bearer ${c.env.POSTHOG_API_KEY}`
            }
          }
        );

        checks["posthog"] = {
          status: response.ok ? "healthy" : "unhealthy",
          responseTime: Date.now() - posthogStart,
          statusCode: response.status
        };
      } catch (error) {
        checks["posthog"] = {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }

    const overallStatus = Object.values(checks).every(
      (check: HealthCheckResult) => check.status === "healthy"
    )
      ? "healthy"
      : "degraded";

    const totalResponseTime = Date.now() - startTime;

    return c.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: totalResponseTime,
      checks
    });
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Detailed health check failed",
      error instanceof Error ? error : new Error(String(error))
    );

    return c.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
        checks
      },
      503
    );
  }
});
