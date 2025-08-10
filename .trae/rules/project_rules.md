# Project Rules for WeMake Monolith

These rules guide AI agents in contributing to the WeMake monolith repository, a
modular monorepo built with Astro, Cloudflare Workers, TypeScript, and Bun. The
platform includes enterprise-grade AI/LLM services, web applications, and shared
packages. These rules incorporate best practices from coding standards,
workflow, debugging, refactoring, security, testing, TypeScript, monorepo
management, Cloudflare specifics, Astro guidelines, and AI/LLM development
patterns. Agents must adhere strictly to these for consistent, high-quality
contributions.

## General Principles

- **Modular Monolith Focus**: Maintain clear boundaries between apps, packages,
  and modules. Organize around business domains with shared infrastructure.
  Follow workspace structure: `src/*` for applications, `workers/*` for
  Cloudflare Workers, `packages/*` for shared code.
- **Digital-First and Sustainable**: Prioritize full digitization, environmental
  responsibility, innovation, and measurable impact.
- **Functional Programming**: Favor pure functions, immutability, and
  declarative patterns. Avoid classes unless necessary (e.g., Durable Objects,
  AI SDK providers).
- **Enterprise-Grade Quality**: Implement production-ready patterns with proper
  error handling, monitoring, security, and performance optimization.
- **AI-First Development**: Design with AI/LLM integration in mind, following
  OpenAI-compatible patterns and streaming response architectures.

## Coding Standards

- **TypeScript Usage**: Enable strict typing with comprehensive tsconfig.json;
  avoid `any`. Use explicit return types, strict null checks, and no unused
  parameters. Document with JSDoc for complex logic, especially AI/LLM
  integrations.
- **ESLint 9+ Flat Config**: Follow `eslint.config.js` with TypeScript ESLint,
  Astro ESLint plugins. Run `bun run lint:fix` before commits,
  `bun run lint:check` for CI/CD.
- **Readability**: Keep files <300 lines; refactor large components. Use guard
  clauses and follow Prettier config (no semicolons, double quotes, 80 char
  width).
- **DRY Principle**: Reuse from `packages/` using workspace imports
  (`@wemake/*`). Eliminate duplication across the monorepo.
- **Naming**: Descriptive names; follow conventions (PascalCase for components,
  kebab-case for pages, camelCase for functions).
- **Function-Level Comments**: Add comprehensive comments for all functions,
  especially complex business logic and AI/LLM integrations.
- **No One-Time Scripts**: Place utilities in root `scripts/` if needed.

## Workflow

- **Task Execution**: Define tasks with requirements; use TDD. Verify changes
  with tests and manual checks. Run `bun check` for TypeScript validation.
- **Pre-Commit Process**: Always run `bun run lint:fix && bun run prettier:fix`
  before committing. Use `bun run check` for comprehensive validation
  (TypeScript + ESLint + Prettier).
- **Git Hygiene**: Atomic commits; keep directory clean. Follow branching
  strategy. Use conventional commit messages.
- **Environment**: Use `.dev.vars` for local secrets (never commit). Restart
  servers after config changes. Use `wrangler.jsonc` for Worker configuration.
- **Development Commands**: Use workspace-specific commands
  (`bun run --cwd src/website dev`) or root-level commands with filters. Prefer
  Bun over npm/yarn.
- **MCP Usage**: Leverage MCP for automation, memory, and sequential thinking.
  Document new integrations. Use Trae IDE for enhanced development experience.
- **CI/CD Integration**: Ensure all changes pass `bun run lint:check` (zero
  warnings) and `bun check` in automated pipelines.

## Testing

- **TDD**: Write tests first for features/bugs. Cover critical paths and edges.
- **Types**: Unit (Vitest), integration, E2E (Playwright). All must pass before
  commits. Use `@cloudflare/vitest-pool-workers` for Worker testing.
- **Mocking**: Only in tests; use real data in dev/prod.
- **Manual Verification**: For UI/UX and complex flows.
- **AI/LLM Testing**: Test streaming responses, rate limiting, authentication,
  and error handling. Mock external AI providers in tests.

## AI/LLM Development

- **OpenAI Compatibility**: Implement OpenAI-compatible endpoints
  (`/v1/chat/completions`) with proper request/response schemas. Support
  streaming and non-streaming modes.
- **AI SDK Integration**: Use AI SDK 5 with OpenRouter provider. Implement
  proper error handling, retries, and fallback mechanisms.
- **Streaming Responses**: Use Server-Sent Events (SSE) for real-time streaming.
  Handle connection management, backpressure, and graceful termination.
- **Rate Limiting**: Implement multi-layer rate limiting (per-user, per-IP,
  global). Use Cloudflare KV for distributed rate limiting state.
- **Authentication**: Secure API key validation with proper hashing. Implement
  JWT or similar for session management.
- **Observability**: Integrate PostHog for LLM analytics. Track usage metrics,
  performance, errors, and user behavior patterns.
- **Error Handling**: Provide detailed error responses with proper HTTP status
  codes. Implement circuit breaker patterns for external API failures.
- **Performance**: Optimize for P95 < 200ms response times. Implement caching
  strategies for deterministic requests (60%+ cache hit rate target).
- **Security**: Validate all inputs, implement CORS policies, use security
  headers. Never log sensitive data or API keys.
- **Cost Management**: Monitor usage patterns, implement quota enforcement, and
  budget alerts to prevent cost overruns.

## Debugging

- **Steps**: Reproduce issues; check logs (browser, `bun dev`, `wrangler tail`).
  Verify configs like wrangler.jsonc.
- **Isolation**: Simplify code; add targeted logging (remove before commit).
- **Fixes**: Address root causes; test thoroughly. Document complex fixes if
  needed.

## Refactoring

- **Purposeful**: Improve clarity, reduce duplication, or align with
  architecture. Preserve behavior.
- **Incremental**: Small steps; ensure test coverage first.
- **Holistic**: Check for duplicates; consider moving to `packages/`.
- **Edit in Place**: Modify existing files; no duplicates like 'v2'.

## Security

- **Server-Side**: Handle sensitive logic in Cloudflare Workers. Use Worker
  bindings for secure access to D1, KV, R2, and external APIs.
- **Input Validation**: Sanitize all inputs using Zod schemas; encode outputs to
  prevent XSS. Validate API requests against OpenAI schemas.
- **Secrets Management**: Use Cloudflare secrets and environment variables;
  never hardcode. Hash API keys before storage.
- **Authentication & Authorization**: Implement robust API key validation, JWT
  tokens, and role-based access control.
- **Rate Limiting**: Multi-layer protection (per-user, per-IP, global) with
  Cloudflare KV state management. Implement exponential backoff.
- **Security Headers**: Set comprehensive security headers (CORS, CSP, HSTS) in
  Workers. Follow OWASP security guidelines.
- **Data Protection**: Never log sensitive data, API keys, or user content.
  Implement proper data retention and deletion policies.
- **Monitoring**: Real-time security monitoring with PostHog. Alert on
  suspicious patterns, failed authentication attempts, and rate limit
  violations.

## TypeScript Specifics

- **Strong Typing**: Explicit types for functions; use interfaces for objects.
- **RORO Pattern**: For complex parameters.
- **Error Handling**: Guard clauses, explicit errors, validation (e.g., Zod).

## Monorepo Management

- **Workspace Structure**: Follow defined workspaces in package.json: `src/*`
  for applications, `workers/*` for Cloudflare Workers, `packages/*` for shared
  code.
- **Dependencies**: Install from root with `bun install`; add workspace-specific
  dependencies using `bun add <package> --cwd <workspace>`.
- **Scripts**: Run root scripts from root; use
  `bun run --cwd <workspace> <script>` for workspace-specific commands. Prefer
  Bun over npm/yarn.
- **Shared Code**: Import from `packages/` using workspace imports
  (`@wemake/*`). Configure path mapping in tsconfig.json.
- **Build Isolation**: Use Bun workspaces for dependency isolation and shared
  build caching. Maintain independent test environments per workspace.
- **Version Management**: Use workspace protocol (`workspace:*`) for internal
  dependencies. Maintain consistent versioning across related packages.

## Cloudflare

- **Workers**: ES modules with TypeScript; configure bindings in
  `wrangler.jsonc`. Use `@cloudflare/workers-types` for type definitions.
- **Storage**: KV for caching and rate limiting state, R2 for objects, D1 for
  relational data, Durable Objects for consistency and real-time features.
- **Development**: Use `wrangler dev` with `--x-remote-bindings` for local
  development. Use `wrangler preview` for staging validation.
- **Deployment**: Use `wrangler deploy` with environment-specific configs.
  Automate via GitHub Actions with proper staging/production workflows.
- **Monitoring**: Use `wrangler tail` for real-time logs. Integrate with PostHog
  for analytics and error tracking.
- **Performance**: Leverage edge computing benefits. Implement proper caching
  strategies and optimize cold start times.
- **Security**: Use Worker bindings for secure API access. Implement proper CORS
  and security headers.

## Astro Specifics

- **Components**: `.astro` for core; framework files for others. Use props and
  composition.
- **Routing**: File-based in `src/pages/`; dynamic with brackets.
- **Content**: MDX/collections in `src/content/`.
- **Styling**: Scoped `<style>`; global CSS imports; Tailwind utilities.
- **Performance**: Static generation; partial hydration with `client:*`.
- **Data**: Top-level await; `getStaticPaths()` for static builds.
- **A11y**: Semantic HTML, ARIA, keyboard support.

## Platform Resources

- **Trae IDE**: Primary development environment with AI-assisted coding
  capabilities. Leverage MCP servers for enhanced productivity.
- **OpenRouter**: Primary LLM provider for AI SDK integration. Implement
  fallback strategies and proper error handling.
- **Bun**: Package manager and runtime. Use for all dependency management,
  script execution, and testing.
- **Neon**: PostgreSQL database service for production data storage. Implement
  proper connection pooling and query optimization.
- **PostHog**: Analytics and observability platform. Track user behavior,
  performance metrics, and LLM usage patterns.
- **Cloudflare Workers**: Edge computing platform for API endpoints, middleware,
  and real-time processing.

## Validation & Compliance

Agents must verify adherence to these rules before finalizing changes:

1. **Code Quality**: Run `bun run check` (TypeScript + ESLint + Prettier)
2. **Testing**: Ensure all tests pass, including AI/LLM-specific tests
3. **Security**: Validate input sanitization, authentication, and rate limiting
4. **Performance**: Verify response times and caching strategies
5. **Documentation**: Update relevant docs and add function-level comments
6. **Monorepo Structure**: Maintain proper workspace boundaries and imports

Reference README.md for repo structure and commands. Follow DEVELOPMENT.md for
detailed workflow guidance.
