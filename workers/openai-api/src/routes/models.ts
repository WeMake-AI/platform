/**
 * Models endpoint for listing available AI models
 */

import { Hono } from "hono";
import type { AppContext } from "../types/env";
import type { ModelsResponse, ModelInfo } from "../types/api";
import { createLogger } from "../utils/logger";

/**
 * OpenRouter model data interface
 */
interface OpenRouterModel {
  id: string;
  name?: string;
  owned_by?: string;
  created?: number;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    image?: string;
    request?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
}

/**
 * Models router
 */
export const models = new Hono<AppContext>();

/**
 * GET /v1/models
 * List available models from OpenRouter
 */
models.get("/", async (c) => {
  try {
    // Fetch models from OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${c.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://wemake.cx",
        "X-Title": "WeMake AI Platform"
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = (await response.json()) as { data: OpenRouterModel[] };

    // Transform OpenRouter response to OpenAI format
    const transformedModels: ModelInfo[] = data.data.map(
      (model: OpenRouterModel) => ({
        id: model.id,
        object: "model",
        created: Math.floor(Date.now() / 1000),
        owned_by: model.owned_by || "openrouter",
        permission: [],
        root: model.id
      })
    );

    const response_data: ModelsResponse = {
      object: "list",
      data: transformedModels
    };

    return c.json(response_data);
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Models endpoint error",
      error instanceof Error ? error : new Error(String(error))
    );

    return c.json(
      {
        error: {
          message: "Failed to fetch available models",
          type: "internal_server_error",
          code: "models_fetch_error"
        }
      },
      500
    );
  }
});

/**
 * GET /v1/models/:model_id
 * Get specific model information
 */
models.get("/:model_id", async (c) => {
  const modelId = c.req.param("model_id");

  try {
    // Fetch specific model from OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${c.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://wemake.cx",
        "X-Title": "WeMake AI Platform"
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = (await response.json()) as { data: OpenRouterModel[] };
    const model = data.data.find((m: OpenRouterModel) => m.id === modelId);

    if (!model) {
      return c.json(
        {
          error: {
            message: `Model '${modelId}' not found`,
            type: "invalid_request_error",
            code: "model_not_found"
          }
        },
        404
      );
    }

    const transformedModel: ModelInfo = {
      id: model.id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: model.owned_by || "openrouter",
      permission: [],
      root: model.id
    };

    return c.json(transformedModel);
  } catch (error) {
    const logger = createLogger({
      requestId: c.get("requestId"),
      userId: c.get("userId"),
      env: c.env
    });
    logger.error(
      "Model fetch error",
      error instanceof Error ? error : new Error(String(error))
    );

    return c.json(
      {
        error: {
          message: "Failed to fetch model information",
          type: "internal_server_error",
          code: "model_fetch_error"
        }
      },
      500
    );
  }
});
