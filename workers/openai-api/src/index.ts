/**
 * OpenAI API Worker - Main Entry Point
 *
 * A Cloudflare Worker that provides OpenAI-compatible API endpoints
 * with enhanced features including usage tracking, rate limiting,
 * cost monitoring, and conversation history.
 *
 * @author WeMake Platform
 * @version 1.0.0
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import type { AppContext } from "./types/env";

/**
 * Create and configure the Hono application
 * Sets up middleware and basic routing
 */
function createApp(): Hono<AppContext> {
  const app = new Hono<AppContext>();

  // Security headers middleware
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      },
      crossOriginEmbedderPolicy: false // Required for some AI model integrations
    })
  );

  // CORS middleware with environment-based configuration
  app.use("*", async (c, next) => {
    const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(",") || ["*"];

    return cors({
      origin: allowedOrigins,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Request-ID",
        "X-User-ID"
      ],
      exposeHeaders: [
        "X-Request-ID",
        "X-Rate-Limit-Remaining",
        "X-Rate-Limit-Reset",
        "X-Usage-Cost"
      ],
      credentials: allowedOrigins.includes("*") ? false : true,
      maxAge: 86400 // 24 hours
    })(c, next);
  });

  // Request timing middleware
  app.use("*", timing());

  // Logger middleware with environment-based configuration
  app.use("*", async (c, next) => {
    const logLevel = c.env.LOG_LEVEL || "info";

    if (logLevel === "debug" || c.env.ENVIRONMENT === "development") {
      return logger()(c, next);
    }

    return next();
  });

  // Pretty JSON middleware for development
  app.use("*", async (c, next) => {
    if (c.env.ENVIRONMENT === "development") {
      return prettyJSON()(c, next);
    }
    return next();
  });

  // Request ID middleware
  app.use("*", async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set("requestId", requestId);
    c.header("X-Request-ID", requestId);
    await next();
  });

  return app;
}

/**
 * Initialize the main application with routes
 */
const app = createApp();

/**
 * Health check endpoint
 * Provides comprehensive health status including database connectivity,
 * environment information, and system metrics
 */
app.get("/health", async (c) => {
  const startTime = Date.now();
  const requestId = c.get("requestId");

  try {
    // Basic health check data
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      requestId,
      environment: c.env.ENVIRONMENT || "unknown",
      version: "1.0.0",
      uptime: Date.now() // Worker uptime (simplified)
    };

    // Database connectivity check
    let dbStatus = "unknown";
    let dbLatency = 0;

    try {
      const dbStartTime = Date.now();
      // Simple query to test database connectivity
      const result = await c.env.DB.prepare("SELECT 1 as test").first();
      dbLatency = Date.now() - dbStartTime;
      dbStatus = result ? "connected" : "error";
    } catch (error) {
      console.error("Database health check failed:", error);
      dbStatus = "error";
    }

    // KV store connectivity check
    let kvStatus = "unknown";
    let kvLatency = 0;

    try {
      const kvStartTime = Date.now();
      // Test KV connectivity with a simple operation
      await c.env.RATE_LIMITER.put(`health-check-${requestId}`, "test", {
        expirationTtl: 60
      });
      await c.env.RATE_LIMITER.delete(`health-check-${requestId}`);
      kvLatency = Date.now() - kvStartTime;
      kvStatus = "connected";
    } catch (error) {
      console.error("KV health check failed:", error);
      kvStatus = "error";
    }

    // Calculate total response time
    const responseTime = Date.now() - startTime;

    // Determine overall health status
    const isHealthy = dbStatus === "connected" && kvStatus === "connected";
    const overallStatus = isHealthy ? "healthy" : "degraded";

    const response = {
      ...healthData,
      status: overallStatus,
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        },
        kv_store: {
          status: kvStatus,
          latency: `${kvLatency}ms`
        }
      },
      metrics: {
        responseTime: `${responseTime}ms`,
        memoryUsage: "N/A" // Not available in Workers
      },
      configuration: {
        logLevel: c.env.LOG_LEVEL || "info",
        rateLimitPerMinute: c.env.RATE_LIMIT_PER_MINUTE || "60",
        maxRequestSize: c.env.MAX_REQUEST_SIZE || "1MB",
        cacheEnabled: !!c.env.CACHE
      }
    };

    // Set appropriate HTTP status code
    const statusCode = isHealthy ? 200 : 503;

    return c.json(response, statusCode);
  } catch (error) {
    console.error("Health check error:", error);

    return c.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        requestId,
        error: "Internal health check failure",
        responseTime: `${Date.now() - startTime}ms`
      },
      500
    );
  }
});

/**
 * Root endpoint
 * Provides basic API information and available endpoints
 */
app.get("/", async (c) => {
  return c.json({
    name: "OpenAI API Worker",
    version: "1.0.0",
    description: "OpenAI-compatible API with enhanced features",
    environment: c.env.ENVIRONMENT || "unknown",
    endpoints: {
      health: "/health",
      docs: "/docs",
      api: {
        chat: "/v1/chat/completions",
        models: "/v1/models",
        usage: "/v1/usage"
      }
    },
    features: [
      "OpenAI-compatible API",
      "Usage tracking and analytics",
      "Rate limiting and quotas",
      "Cost monitoring",
      "Conversation history",
      "Multiple AI model support",
      "Real-time streaming"
    ],
    documentation: "https://docs.wemake.dev/api/openai",
    support: "https://github.com/wemake-dev/platform/issues"
  });
});

/**
 * API documentation endpoint
 * Provides OpenAPI/Swagger-style documentation
 */
app.get("/docs", async (c) => {
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "OpenAI API Worker",
      version: "1.0.0",
      description:
        "OpenAI-compatible API with enhanced features for usage tracking, rate limiting, and cost monitoring.",
      contact: {
        name: "WeMake Platform",
        url: "https://wemake.dev",
        email: "support@wemake.dev"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "https://api.wemake.dev",
        description: "Production server"
      },
      {
        url: "https://staging-api.wemake.dev",
        description: "Staging server"
      }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check endpoint",
          description:
            "Returns the health status of the API worker including database and KV store connectivity.",
          responses: {
            "200": {
              description: "Service is healthy"
            },
            "503": {
              description: "Service is degraded"
            }
          }
        }
      },
      "/v1/chat/completions": {
        post: {
          summary: "Create chat completion",
          description:
            "Creates a chat completion using various AI models with OpenAI-compatible interface.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    model: {
                      type: "string",
                      example: "anthropic/claude-3.5-sonnet"
                    },
                    messages: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          role: {
                            type: "string",
                            enum: ["system", "user", "assistant"]
                          },
                          content: { type: "string" }
                        }
                      }
                    },
                    temperature: { type: "number", minimum: 0, maximum: 2 },
                    max_tokens: { type: "integer", minimum: 1 },
                    stream: { type: "boolean" }
                  },
                  required: ["model", "messages"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Chat completion response"
            },
            "400": {
              description: "Invalid request"
            },
            "401": {
              description: "Unauthorized"
            },
            "429": {
              description: "Rate limit exceeded"
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "API key authentication using Bearer token"
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  });
});

// TODO: Implement additional routes
// app.route('/v1/models', models);
// app.route('/v1/chat', chatCompletions);
// app.route('/v1/usage', usage);

/**
 * 404 handler for unmatched routes
 */
app.notFound((c) => {
  return c.json(
    {
      error: {
        message: "Not Found",
        type: "invalid_request_error",
        code: "not_found"
      }
    },
    404
  );
});

/**
 * Global error handler
 */
app.onError((err, c) => {
  console.error("Worker error:", err);

  return c.json(
    {
      error: {
        message: "Internal Server Error",
        type: "internal_server_error",
        code: "internal_error"
      }
    },
    500
  );
});

/**
 * Export the Hono app as the default Worker handler
 */
export default app;
