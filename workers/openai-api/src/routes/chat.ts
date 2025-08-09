/**
 * Chat completions endpoint for OpenAI-compatible API
 */

import { Hono } from "hono";
import { z } from "zod";
import type { AppContext } from "../types/env";
import type { ChatCompletionResponse } from "../types/api";
import { createLogger } from "../utils/logger";

/**
 * OpenRouter error response interface
 */
interface OpenRouterErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
  message?: string;
}

/**
 * OpenRouter completion response interface
 */
interface OpenRouterCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Chat completions router
 */
export const chatCompletions = new Hono<AppContext>();

/**
 * Request validation schema
 */
const chatCompletionSchema = z.object({
  model: z.string().optional().default("anthropic/claude-3.5-sonnet"),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant", "function"]),
        content: z.string().max(32000), // Prevent extremely large inputs
        name: z.string().optional()
      })
    )
    .min(1)
    .max(100), // Limit conversation length
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().min(1).max(8192).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional().default(false),
  user: z.string().optional()
});

/**
 * POST /v1/chat/completions
 * Create a chat completion
 */
chatCompletions.post("/completions", async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validatedRequest = chatCompletionSchema.parse(body);

    const userId = c.get("userId");
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Get default model if not specified
    const model =
      validatedRequest.model ||
      c.env.DEFAULT_MODEL ||
      "anthropic/claude-3.5-sonnet";
    const maxTokens =
      validatedRequest.max_tokens ||
      parseInt(c.env.MAX_TOKENS_DEFAULT || "4096", 10);

    // Prepare request for OpenRouter
    const openrouterRequest = {
      model,
      messages: validatedRequest.messages,
      temperature: validatedRequest.temperature,
      max_tokens: maxTokens,
      top_p: validatedRequest.top_p,
      frequency_penalty: validatedRequest.frequency_penalty,
      presence_penalty: validatedRequest.presence_penalty,
      stop: validatedRequest.stop,
      stream: validatedRequest.stream,
      user: userId
    };

    // Make request to OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://wemake.cx",
          "X-Title": "WeMake AI Platform",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(openrouterRequest)
      }
    );

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as OpenRouterErrorResponse;
      const logger = createLogger({
        requestId: c.get("requestId"),
        userId: c.get("userId"),
        env: c.env
      });
      logger.error("OpenRouter API error", undefined, {
        status: response.status,
        errorData
      });

      return c.json(
        {
          error: {
            message:
              errorData.error?.message || "Failed to generate completion",
            type: "api_error",
            code: "openrouter_error"
          }
        },
        response.status as 500
      );
    }

    // Handle streaming response
    if (validatedRequest.stream) {
      // For now, return a simple message that streaming will be implemented
      return c.json(
        {
          error: {
            message: "Streaming not yet implemented",
            type: "not_implemented_error",
            code: "streaming_not_implemented"
          }
        },
        501
      );
    }

    // Handle non-streaming response
    const completionData =
      (await response.json()) as OpenRouterCompletionResponse;
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Track usage (placeholder for now)
    if (completionData.usage) {
      // TODO: Implement usage tracking with PostHog and database
      const logger = createLogger({
        requestId: c.get("requestId"),
        userId: c.get("userId"),
        env: c.env
      });
      logger.info("Usage tracking", {
        userId,
        requestId,
        model,
        inputTokens: completionData.usage.prompt_tokens,
        outputTokens: completionData.usage.completion_tokens,
        latency
      });
    }

    // Transform response to match OpenAI format
    const transformedResponse: ChatCompletionResponse = {
      id: completionData.id || `chatcmpl-${requestId}`,
      object: "chat.completion",
      created: Math.floor(startTime / 1000),
      model: completionData.model || model,
      choices: (completionData.choices || []).map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role as
            | "system"
            | "user"
            | "assistant"
            | "function",
          content: choice.message.content
        },
        finish_reason: choice.finish_reason as
          | "stop"
          | "length"
          | "content_filter"
          | null
      })),
      usage: completionData.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    return c.json(transformedResponse);
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Chat completion error",
      error instanceof Error ? error : new Error(String(error))
    );

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: {
            message: "Invalid request format",
            type: "invalid_request_error",
            code: "validation_error",
            details: error.errors
          }
        },
        400
      );
    }

    return c.json(
      {
        error: {
          message: "Internal server error",
          type: "internal_server_error",
          code: "completion_error"
        }
      },
      500
    );
  }
});
