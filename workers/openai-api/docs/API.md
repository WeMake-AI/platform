# OpenAI API Worker - API Documentation

This document provides comprehensive API documentation for the OpenAI API
Worker, including all endpoints, request/response formats, authentication, and
usage examples.

## Base URL

- **Production**: `https://openai-api.wemake.workers.dev`
- **Staging**: `https://openai-api-staging.wemake.workers.dev`
- **Development**: `http://localhost:8787`

## Authentication

All API requests require authentication using an API key in the Authorization
header:

```http
Authorization: Bearer your-api-key-here
```

### API Key Management

API keys are managed through the admin interface and have the following
properties:

- **Scoped Permissions**: Keys can be restricted to specific endpoints
- **Rate Limiting**: Each key has configurable rate limits
- **Usage Tracking**: All requests are logged for analytics
- **Expiration**: Keys can have expiration dates

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Default Limit**: 60 requests per minute per API key
- **Burst Limit**: Up to 10 requests per second
- **Headers**: Rate limit information is returned in response headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Common Headers

### Request Headers

| Header          | Required | Description                                  |
| --------------- | -------- | -------------------------------------------- |
| `Authorization` | Yes      | Bearer token for authentication              |
| `Content-Type`  | Yes      | Must be `application/json` for POST requests |
| `X-Request-ID`  | No       | Custom request ID for tracking               |
| `User-Agent`    | No       | Client identification                        |

### Response Headers

| Header            | Description                             |
| ----------------- | --------------------------------------- |
| `X-Request-ID`    | Unique request identifier               |
| `X-Response-Time` | Request processing time in milliseconds |
| `X-RateLimit-*`   | Rate limiting information               |
| `Cache-Control`   | Caching directives                      |

## Endpoints

### Health Check

#### GET /health

Returns the health status of the worker and its dependencies.

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "requestId": "req_123456789",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45,
      "lastCheck": "2024-01-01T00:00:00.000Z"
    },
    "kvStore": {
      "status": "healthy",
      "responseTime": 12,
      "lastCheck": "2024-01-01T00:00:00.000Z"
    },
    "openrouter": {
      "status": "healthy",
      "responseTime": 234,
      "lastCheck": "2024-01-01T00:00:00.000Z"
    }
  },
  "system": {
    "uptime": 86400,
    "memory": {
      "used": 45.2,
      "limit": 128
    },
    "requests": {
      "total": 12345,
      "errors": 23,
      "avgResponseTime": 156
    }
  }
}
```

**Status Codes**:

- `200`: All systems healthy
- `503`: One or more systems unhealthy

### API Information

#### GET /

Returns basic API information and available endpoints.

**Response**:

```json
{
  "name": "OpenAI API Worker",
  "version": "1.0.0",
  "description": "High-performance OpenAI-compatible API using OpenRouter",
  "environment": "production",
  "endpoints": {
    "health": "/health",
    "models": "/v1/models",
    "chat": "/v1/chat/completions",
    "embeddings": "/v1/embeddings",
    "docs": "/docs"
  },
  "documentation": "https://docs.wemake.dev/openai-api",
  "support": "dev-team@wemake.dev"
}
```

### API Documentation

#### GET /docs

Returns OpenAPI 3.0 specification for the API.

**Response**: OpenAPI 3.0 JSON specification

### Models

#### GET /v1/models

Returns a list of available AI models.

**Authentication**: Required

**Response**:

```json
{
  "object": "list",
  "data": [
    {
      "id": "openai/gpt-4",
      "object": "model",
      "created": 1640995200,
      "owned_by": "openai",
      "permission": [],
      "root": "gpt-4",
      "parent": null,
      "pricing": {
        "prompt": "0.00003",
        "completion": "0.00006",
        "currency": "USD",
        "unit": "token"
      },
      "context_length": 8192,
      "architecture": {
        "modality": "text",
        "tokenizer": "cl100k_base",
        "instruct_type": "chat"
      },
      "top_provider": {
        "max_completion_tokens": 4096,
        "is_moderated": true
      }
    }
  ]
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Internal server error

### Chat Completions

#### POST /v1/chat/completions

Creates a chat completion using the specified model.

**Authentication**: Required

**Request Body**:

```json
{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "stream": false
}
```

**Parameters**:

| Parameter           | Type         | Required | Description                                  |
| ------------------- | ------------ | -------- | -------------------------------------------- |
| `model`             | string       | Yes      | Model ID to use for completion               |
| `messages`          | array        | Yes      | Array of message objects                     |
| `max_tokens`        | integer      | No       | Maximum tokens to generate (default: 150)    |
| `temperature`       | number       | No       | Sampling temperature 0-2 (default: 0.7)      |
| `top_p`             | number       | No       | Nucleus sampling parameter (default: 1)      |
| `frequency_penalty` | number       | No       | Frequency penalty -2 to 2 (default: 0)       |
| `presence_penalty`  | number       | No       | Presence penalty -2 to 2 (default: 0)        |
| `stream`            | boolean      | No       | Whether to stream responses (default: false) |
| `stop`              | string/array | No       | Stop sequences                               |
| `user`              | string       | No       | User identifier for tracking                 |

**Message Object**:

```json
{
  "role": "user|assistant|system",
  "content": "Message content",
  "name": "Optional message name"
}
```

**Response (Non-streaming)**:

```json
{
  "id": "chatcmpl-123456789",
  "object": "chat.completion",
  "created": 1640995200,
  "model": "openai/gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  },
  "system_fingerprint": "fp_123456"
}
```

**Response (Streaming)**:

When `stream: true`, responses are sent as Server-Sent Events:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1640995200,"model":"openai/gpt-4","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1640995200,"model":"openai/gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: [DONE]
```

**Status Codes**:

- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Internal server error

### Embeddings

#### POST /v1/embeddings

Creates embeddings for the given input text.

**Authentication**: Required

**Request Body**:

```json
{
  "model": "openai/text-embedding-ada-002",
  "input": "The quick brown fox jumps over the lazy dog",
  "encoding_format": "float",
  "user": "user-123"
}
```

**Parameters**:

| Parameter         | Type         | Required | Description                                    |
| ----------------- | ------------ | -------- | ---------------------------------------------- |
| `model`           | string       | Yes      | Embedding model ID                             |
| `input`           | string/array | Yes      | Text to embed                                  |
| `encoding_format` | string       | No       | Format: "float" or "base64" (default: "float") |
| `user`            | string       | No       | User identifier                                |

**Response**:

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.1, 0.2, 0.3, ...]
    }
  ],
  "model": "openai/text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```

**Status Codes**:

- `200`: Success
- `400`: Bad request
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Internal server error

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_api_key",
    "message": "Invalid API key provided",
    "param": null,
    "request_id": "req_123456789"
  }
}
```

### Error Types

| Type                    | Description                |
| ----------------------- | -------------------------- |
| `invalid_request_error` | Invalid request parameters |
| `authentication_error`  | Authentication failed      |
| `permission_error`      | Insufficient permissions   |
| `rate_limit_error`      | Rate limit exceeded        |
| `api_error`             | Internal API error         |
| `overloaded_error`      | API temporarily overloaded |

### Common Error Codes

| Code                      | Status | Description                        |
| ------------------------- | ------ | ---------------------------------- |
| `invalid_api_key`         | 401    | API key is invalid or missing      |
| `insufficient_quota`      | 429    | API key quota exceeded             |
| `rate_limit_exceeded`     | 429    | Rate limit exceeded                |
| `model_not_found`         | 404    | Requested model not available      |
| `invalid_request`         | 400    | Request parameters are invalid     |
| `context_length_exceeded` | 400    | Input exceeds model context length |
| `server_error`            | 500    | Internal server error              |
| `service_unavailable`     | 503    | Service temporarily unavailable    |

## Usage Examples

### cURL Examples

#### Get Available Models

```bash
curl -X GET "https://openai-api.wemake.workers.dev/v1/models" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json"
```

#### Chat Completion

```bash
curl -X POST "https://openai-api.wemake.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, world!"}
    ],
    "max_tokens": 50
  }'
```

#### Streaming Chat Completion

```bash
curl -X POST "https://openai-api.wemake.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'
```

#### Create Embeddings

```bash
curl -X POST "https://openai-api.wemake.workers.dev/v1/embeddings" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/text-embedding-ada-002",
    "input": "Hello, world!"
  }'
```

### JavaScript/TypeScript Examples

#### Using Fetch API

```typescript
const apiKey = "your-api-key";
const baseUrl = "https://openai-api.wemake.workers.dev";

// Chat completion
async function createChatCompletion(messages: any[]) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4",
      messages,
      max_tokens: 150
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Usage
const result = await createChatCompletion([
  { role: "user", content: "Hello, how are you?" }
]);
console.log(result.choices[0].message.content);
```

#### Using OpenAI SDK (Compatible)

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "your-api-key",
  baseURL: "https://openai-api.wemake.workers.dev/v1"
});

// Chat completion
const completion = await openai.chat.completions.create({
  model: "openai/gpt-4",
  messages: [{ role: "user", content: "Hello, world!" }]
});

console.log(completion.choices[0].message.content);

// Embeddings
const embedding = await openai.embeddings.create({
  model: "openai/text-embedding-ada-002",
  input: "Hello, world!"
});

console.log(embedding.data[0].embedding);
```

### Python Examples

#### Using Requests

```python
import requests
import json

api_key = 'your-api-key'
base_url = 'https://openai-api.wemake.workers.dev'

def create_chat_completion(messages):
    response = requests.post(
        f'{base_url}/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'openai/gpt-4',
            'messages': messages,
            'max_tokens': 150,
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
result = create_chat_completion([
    {'role': 'user', 'content': 'Hello, how are you?'}
])
print(result['choices'][0]['message']['content'])
```

#### Using OpenAI SDK

```python
from openai import OpenAI

client = OpenAI(
    api_key='your-api-key',
    base_url='https://openai-api.wemake.workers.dev/v1'
)

# Chat completion
completion = client.chat.completions.create(
    model='openai/gpt-4',
    messages=[
        {'role': 'user', 'content': 'Hello, world!'}
    ]
)

print(completion.choices[0].message.content)

# Embeddings
embedding = client.embeddings.create(
    model='openai/text-embedding-ada-002',
    input='Hello, world!'
)

print(embedding.data[0].embedding)
```

## Best Practices

### Performance Optimization

1. **Batch Requests**: Group multiple requests when possible
2. **Caching**: Cache responses for repeated queries
3. **Streaming**: Use streaming for long responses
4. **Model Selection**: Choose appropriate models for your use case

### Error Handling

1. **Retry Logic**: Implement exponential backoff for retries
2. **Rate Limiting**: Respect rate limits and handle 429 errors
3. **Timeout Handling**: Set appropriate timeouts for requests
4. **Graceful Degradation**: Handle API unavailability gracefully

### Security

1. **API Key Protection**: Never expose API keys in client-side code
2. **Request Validation**: Validate all input parameters
3. **Rate Limiting**: Implement client-side rate limiting
4. **Monitoring**: Monitor for unusual usage patterns

### Cost Optimization

1. **Token Management**: Monitor and optimize token usage
2. **Model Selection**: Use cost-effective models when appropriate
3. **Caching**: Cache responses to reduce API calls
4. **Request Optimization**: Minimize unnecessary requests

## Changelog

### v1.0.0 (2024-01-01)

- Initial release
- Chat completions endpoint
- Models listing endpoint
- Embeddings endpoint
- Health check endpoint
- Rate limiting
- Authentication
- Analytics integration

---

For more information, visit the [main documentation](../README.md) or contact
the development team at dev-team@wemake.dev.
