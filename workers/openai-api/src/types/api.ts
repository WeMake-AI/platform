/**
 * API request and response type definitions
 */

/**
 * OpenAI Chat Completion API types
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
  user?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: "stop" | "length" | "content_filter" | null;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Model information
 */
/**
 * Model permission interface
 */
export interface ModelPermission {
  id: string;
  object: string;
  created: number;
  allow_create_engine: boolean;
  allow_sampling: boolean;
  allow_logprobs: boolean;
  allow_search_indices: boolean;
  allow_view: boolean;
  allow_fine_tuning: boolean;
  organization: string;
  group?: string;
  is_blocking: boolean;
}

export interface ModelInfo {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  permission?: ModelPermission[];
  root?: string;
  parent?: string;
}

export interface ModelsResponse {
  object: "list";
  data: ModelInfo[];
}

/**
 * Usage tracking types
 */
export interface UsageEvent {
  userId: string;
  requestId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latency?: number;
  cost?: number;
}

/**
 * Daily usage data interface
 */
export interface DailyUsage {
  date: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
}

export interface UsageResponse {
  object: "usage";
  start_date: string;
  end_date: string;
  totals: {
    requests: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost: number;
  };
  daily_usage: DailyUsage[];
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
    param?: string;
  };
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version?: string;
  uptime?: number;
}
