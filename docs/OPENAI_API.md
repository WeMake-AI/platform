# OpenAI-compatible AI Gateway on Cloudflare Workers

**Production-ready LLM endpoint using OpenRouter + Neon + PostHog
observability**

Optimized for AI-agent assisted solo full-stack development with copy-paste
velocity.

## 📋 **Table of Contents**

1. [🚀 5-Minute Quick Start](#-5-minute-quick-start)
2. [⚙️ Environment & Configuration](#️-environment--configuration)
3. [🔥 Agent-Ready TL;DR Snippets](#-agent-ready-tldr-snippets)
4. [🏗️ Architecture Overview](#️-architecture-overview)
5. [🤖 AI Integration & Analytics](#-ai-integration--analytics)
6. [🔒 Security & Performance](#-security--performance)
7. [🚀 API Implementation](#-api-implementation)
8. [🧪 Testing Strategy](#-testing-strategy)
9. [📦 Deployment Guide](#-deployment-guide)
10. [🔧 Troubleshooting](#-troubleshooting)
11. [📚 Additional Resources](#-additional-resources)

## 🚀 **5-Minute Quick Start**

### Prerequisites

**System Requirements:** macOS Sequoia 15.5, Bun runtime, Cloudflare account

- [Cloudflare Workers](https://workers.cloudflare.com/) with KV and D1/R2
  enabled
- [OpenRouter API key](https://openrouter.ai/keys) with model access
- [PostHog project](https://app.posthog.com/) for LLM observability
- [Neon account](https://neon.tech/) for serverless Postgres (optional)

### One-Block Setup

```sh
# Clone monorepo and navigate to workspace
git clone https://github.com/WeMake-AI/platform.git /Users/admin/Repositories/WeMake/platform
cd /Users/admin/Repositories/WeMake/platform

# Install dependencies via monorepo root
bun install

# Create environment configuration
cat > src/website/workers/openai-api/.dev.vars << 'EOF'
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key-here
DEFAULT_MODEL=anthropic/claude-3.5-sonnet
MAX_TOKENS_DEFAULT=4096

# PostHog LLM Observability
POSTHOG_API_KEY=phc_your-posthog-project-api-key-here
POSTHOG_HOST=https://app.posthog.com

# Database (choose one: d1 or neon)
DB_PROVIDER=neon
NEON_DATABASE_URL=postgresql://user:pass@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require

# CORS & Security
ALLOWED_ORIGINS=http://localhost:4321,http://localhost:3000,https://wemake.cx
RATE_LIMIT_PER_MINUTE=60

# Optional: Cloudflare AI Gateway
# CF_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/your-account-id/your-gateway/openai
EOF

# Start development server
cd src/website/workers/openai-api
bun run dev

# Test endpoint (in new terminal)
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer test-api-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"Hello!"}],"stream":true}'
```

**Success indicator:** Streaming SSE response with `data: {"choices":[...]}`
chunks.

### Workspace Structure

```
platform/
├── src/website/workers/openai-api/     # Primary worker location
│   ├── src/
│   │   ├── index.ts                    # Main entry point
│   │   ├── lib/                        # Shared utilities
│   │   │   ├── openrouter.ts          # OpenRouter client
│   │   │   ├── posthog.ts             # Analytics client
│   │   │   └── auth.ts                # Authentication
│   │   └── middleware/                 # Hono middlewares
│   ├── .dev.vars                      # Local secrets (gitignored)
│   ├── wrangler.toml                  # Worker configuration
│   ├── schema.sql                     # Database migrations
│   └── package.json                   # Worker dependencies
└── docs/OPENAI_API.md                 # This documentation
```

## ⚙️ **Environment & Configuration**

### Environment Variables (.dev.vars)

```sh
# OpenRouter Configuration - Required
OPENROUTER_API_KEY=sk-or-v1-your-api-key-from-openrouter-dashboard
DEFAULT_MODEL=anthropic/claude-3.5-sonnet     # Fallback model
MAX_TOKENS_DEFAULT=4096                       # Per-request limit

# PostHog LLM Observability - Required
POSTHOG_API_KEY=phc_your-project-api-key     # From PostHog project settings
POSTHOG_HOST=https://app.posthog.com          # Or EU: https://eu.posthog.com

# Database Provider - Choose one
DB_PROVIDER=neon                              # Options: "d1" or "neon"
NEON_DATABASE_URL=postgresql://user:pass@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require

# Security & CORS - Required
ALLOWED_ORIGINS=http://localhost:4321,http://localhost:3000,https://wemake.cx
RATE_LIMIT_PER_MINUTE=60                      # Per-API-key rate limit

# Optional Performance
CF_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/your-account/gateway/openai
CACHE_TTL_SECONDS=300                         # Model list cache duration
```

### Wrangler Configuration (wrangler.toml)

```toml
name = "openai-api-worker"
main = "src/index.ts"
compatibility_date = "2024-01-15"
compatibility_flags = ["nodejs_compat"]  # Required for PostHog SDK
node_compat = true

# Development
[env.development]
name = "openai-api-worker-dev"

# Staging Environment
[env.staging]
name = "openai-api-worker-staging"
route = "api-staging.wemake.cx/v1/*"

# Production Environment
[env.production]
name = "openai-api-worker-prod"
route = "api.wemake.cx/v1/*"

# KV Namespace (rate limiting & cache)
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
preview_id = "your-kv-preview-id"

# D1 Database (optional - if DB_PROVIDER=d1)
[[d1_databases]]
binding = "DB"
database_name = "openai-api"
database_id = "your-d1-database-id"

# Production Secrets (set via: wrangler secret put SECRET_NAME)
# OPENROUTER_API_KEY, POSTHOG_API_KEY, NEON_DATABASE_URL
```

### Cloudflare Secrets Setup

```sh
# Set production secrets (never commit to git)
wrangler secret put OPENROUTER_API_KEY --env production
wrangler secret put POSTHOG_API_KEY --env production
wrangler secret put NEON_DATABASE_URL --env production

# Set staging secrets
wrangler secret put OPENROUTER_API_KEY --env staging
wrangler secret put POSTHOG_API_KEY --env staging
wrangler secret put NEON_DATABASE_URL --env staging
```

## 🔥 **Agent-Ready TL;DR Snippets**

### Copy-Paste Implementation Blocks

```typescript
// 1. OPENROUTER CLIENT (lib/openrouter.ts)
import { openai } from "@ai-sdk/openai";

export const OPENROUTER_CONFIG = {
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": "https://wemake.cx",
    "X-Title": "WeMake AI Platform"
  }
} as const;

export function createOpenRouterModel(
  env: Env,
  model = "anthropic/claude-3.5-sonnet"
) {
  return openai({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: OPENROUTER_CONFIG.baseURL,
    headers: OPENROUTER_CONFIG.headers
  })(model);
}

// 2. POSTHOG OBSERVABILITY (lib/posthog.ts)
import { PostHog } from "posthog-node";

export function createPostHogClient(env: Env) {
  return new PostHog(env.POSTHOG_API_KEY, {
    host: env.POSTHOG_HOST || "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
    disableGeoip: true // Privacy-first
  });
}

export async function trackLLMGeneration(
  posthog: PostHog,
  event: {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latency: number;
    cost?: number;
  }
) {
  await posthog.capture({
    distinctId: event.userId,
    event: "$ai_generation",
    properties: {
      $ai_model: event.model,
      $ai_input_tokens: event.inputTokens,
      $ai_output_tokens: event.outputTokens,
      $ai_latency: event.latency,
      $ai_cost: event.cost,
      $ai_provider: "openrouter"
    }
  });
}

// 3. NEON DATABASE CLIENT (lib/database.ts)
import { neon } from "@neondatabase/serverless";

export function createNeonClient(env: Env) {
  if (env.DB_PROVIDER !== "neon" || !env.NEON_DATABASE_URL) {
    throw new Error("Neon configuration required");
  }
  return neon(env.NEON_DATABASE_URL);
}

export async function logUsage(
  sql: ReturnType<typeof neon>,
  data: {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }
) {
  await sql`
    INSERT INTO usage_logs (user_id, model, input_tokens, output_tokens, cost, created_at)
    VALUES (${data.userId}, ${data.model}, ${data.inputTokens}, ${data.outputTokens}, ${data.cost}, NOW())
  `;
}

// 4. STREAMING CHAT ENDPOINT (routes/chat.ts)
import { streamText } from "ai";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const chatSchema = z.object({
  model: z.string().default("anthropic/claude-3.5-sonnet"),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string()
      })
    )
    .min(1),
  stream: z.boolean().default(true),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().min(1).max(8192).optional()
});

export const chatRouter = new Hono<{ Bindings: Env }>().post(
  "/completions",
  zValidator("json", chatSchema),
  async (c) => {
    const { model, messages, stream, temperature, max_tokens } =
      c.req.valid("json");
    const userId = c.get("userId") as string;
    const startTime = Date.now();

    const llmModel = createOpenRouterModel(c.env, model);
    const posthog = createPostHogClient(c.env);

    if (stream) {
      const result = await streamText({
        model: llmModel,
        messages,
        temperature,
        maxTokens: max_tokens || parseInt(c.env.MAX_TOKENS_DEFAULT || "4096")
      });

      // Track usage in background (non-blocking)
      result.finishReason
        .then(async () => {
          const usage = await result.usage;
          await trackLLMGeneration(posthog, {
            userId,
            model,
            inputTokens: usage?.promptTokens || 0,
            outputTokens: usage?.completionTokens || 0,
            latency: Date.now() - startTime
          });
          await posthog.shutdown();
        })
        .catch(console.error);

      return result.toDataStreamResponse();
    }

    // Non-streaming completion
    const { text, usage } = await generateText({
      model: llmModel,
      messages,
      temperature,
      maxTokens: max_tokens || parseInt(c.env.MAX_TOKENS_DEFAULT || "4096")
    });

    // Track usage
    await trackLLMGeneration(posthog, {
      userId,
      model,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      latency: Date.now() - startTime
    });
    await posthog.shutdown();

    return c.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        total_tokens: usage.totalTokens
      }
    });
  }
);

// 5. AUTHENTICATION MIDDLEWARE (lib/auth.ts)
import { createMiddleware } from "hono/factory";
import { createHash } from "node:crypto";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const apiKey = authHeader.slice(7);
    const hashedKey = hashApiKey(apiKey);

    // Validate against database (example for Neon)
    if (c.env.DB_PROVIDER === "neon") {
      const sql = createNeonClient(c.env);
      const [user] = await sql`
      SELECT user_id, usage_limit FROM api_keys 
      WHERE key_hash = ${hashedKey} AND active = true
    `;

      if (!user) {
        return c.json({ error: "Invalid API key" }, 401);
      }

      c.set("userId", user.user_id);
      c.set("usageLimit", user.usage_limit);
    }

    await next();
  }
);

// 6. RATE LIMITING MIDDLEWARE (lib/rateLimit.ts)
export const rateLimitMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const userId = c.get("userId") as string;
    const key = `rate_limit:${userId}:${Math.floor(Date.now() / 60000)}`;

    const current = await c.env.CACHE.get(key);
    const count = current ? parseInt(current) : 0;
    const limit = parseInt(c.env.RATE_LIMIT_PER_MINUTE || "60");

    if (count >= limit) {
      c.header("X-RateLimit-Limit", limit.toString());
      c.header("X-RateLimit-Remaining", "0");
      c.header(
        "X-RateLimit-Reset",
        (Math.floor(Date.now() / 60000) + 1).toString()
      );
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    // Increment counter
    await c.env.CACHE.put(key, (count + 1).toString(), { expirationTtl: 60 });

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", (limit - count - 1).toString());
    c.header(
      "X-RateLimit-Reset",
      (Math.floor(Date.now() / 60000) + 1).toString()
    );

    await next();
  }
);
```

### Environment Setup Commands

```sh
# Monorepo dependency installation
cd /Users/admin/Repositories/WeMake/platform
bun install

# Worker-specific dependencies
cd src/website/workers/openai-api
bun add ai @ai-sdk/openai hono @hono/zod-validator zod posthog-node @neondatabase/serverless

# Development dependencies
bun add -D @cloudflare/workers-types wrangler typescript vitest

# Database setup (choose one)
# Option 1: D1 (Cloudflare)
wrangler d1 create openai-api-dev
wrangler d1 execute openai-api-dev --file=schema.sql

# Option 2: Neon (Serverless Postgres)
# Manual: Create database at console.neon.tech
# Copy connection string to NEON_DATABASE_URL

# KV namespace setup
wrangler kv:namespace create "CACHE" --preview
```

### Testing Commands

```sh
# Unit tests
bun run test

# Integration test with live APIs
OPENROUTER_API_KEY=your-key bun run test:integration

# Load testing
bun run test:load

# Manual endpoint test
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"Test"}],"stream":true}' \
  --no-buffer
```

## 🏗️ **Architecture Overview**

### System Design

```mermaid
graph TB
    Client[Client Applications] --> CF[Cloudflare Workers]
    CF --> Auth[Authentication Layer]
    Auth --> Rate[Rate Limiting]
    Rate --> Router[OpenRouter API]
    CF --> Cache[KV Cache]
    CF --> DB[(Database)]
    CF --> PH[PostHog Analytics]

    subgraph "Database Options"
        D1[(Cloudflare D1)]
        Neon[(Neon Postgres)]
    end

    DB --> D1
    DB --> Neon

    subgraph "OpenRouter Models"
        Claude[Claude 3.5 Sonnet]
        GPT[GPT-4 Turbo]
        Llama[Llama 3]
    end

    Router --> Claude
    Router --> GPT
    Router --> Llama
```

### Core Components

| Component          | Purpose                             | Technology                     |
| ------------------ | ----------------------------------- | ------------------------------ |
| **API Gateway**    | Request routing & validation        | Hono + Cloudflare Workers      |
| **Authentication** | API key validation                  | SHA-256 hashing + D1/Neon      |
| **Rate Limiting**  | Per-user request quotas             | Cloudflare KV (sliding window) |
| **LLM Routing**    | Model selection & fallbacks         | OpenRouter unified API         |
| **Observability**  | Conversation & performance tracking | PostHog LLM analytics          |
| **Caching**        | Response & metadata caching         | Cloudflare KV                  |
| **Database**       | Usage logs & API keys               | Cloudflare D1 or Neon Postgres |

### Request Flow

1. **Client Request** → API with Bearer token
2. **Authentication** → Validate API key against database
3. **Rate Limiting** → Check per-user quotas in KV
4. **Validation** → Zod schema validation
5. **Model Selection** → Choose optimal OpenRouter model
6. **LLM Generation** → Stream response via AI SDK 5
7. **Observability** → Track usage in PostHog
8. **Response** → Stream SSE to client

### Security Architecture

```typescript
// Authentication Flow
interface SecurityConfig {
  apiKeyHashing: "SHA-256"; // One-way key hashing
  rateLimiting: "sliding-window"; // KV-based rate limits
  cors: "origin-validation"; // Whitelist-based CORS
  headers: "security-hardened"; // OWASP recommended headers
  validation: "zod-schemas"; // Runtime type checking
  secrets: "cloudflare-secrets"; // Environment-based secrets
}

// Rate Limiting Implementation
const RATE_LIMIT_CONFIG = {
  windowMs: 60_000, // 1-minute windows
  defaultLimit: 60, // 60 requests/minute
  keyPrefix: "rate_limit:", // KV key namespace
  headers: ["X-RateLimit-*"] // Client visibility
} as const;
```
