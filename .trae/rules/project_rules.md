# Project Rules for WeMake Monolith

These rules guide AI agents in contributing to the WeMake monolith repository, a
modular monorepo built with Astro, Cloudflare, TypeScript, and Bun. They
incorporate best practices from coding standards, workflow, debugging,
refactoring, security, testing, TypeScript, monorepo management, Cloudflare
specifics, and Astro guidelines. Agents must adhere strictly to these for
consistent, high-quality contributions.

## General Principles

- **Modular Monolith Focus**: Maintain clear boundaries between apps, packages,
  and modules. Organize around business domains with shared infrastructure.
- **Digital-First and Sustainable**: Prioritize full digitization, environmental
  responsibility, innovation, and measurable impact.
- **Functional Programming**: Favor pure functions, immutability, and
  declarative patterns. Avoid classes unless necessary (e.g., Durable Objects).

## Coding Standards

- **TypeScript Usage**: Enable strict typing; avoid `any`. Document with JSDoc
  for complex logic.
- **Readability**: Keep files <300 lines; refactor large components. Use guard
  clauses and omit unnecessary braces/semicolons per Prettier.
- **DRY Principle**: Reuse from `packages/`; eliminate duplication across the
  monorepo.
- **Naming**: Descriptive names; follow conventions (PascalCase for components,
  kebab-case for pages).
- **No One-Time Scripts**: Place utilities in root `scripts/` if needed.

## Workflow

- **Task Execution**: Define tasks with requirements; use TDD. Verify changes
  with tests and manual checks.
- **Git Hygiene**: Atomic commits; keep directory clean. Follow branching
  strategy.
- **Environment**: Use `.dev.vars` for local secrets (never commit). Restart
  servers after config changes.
- **MCP Usage**: Leverage MCP for automation, memory, and sequential thinking.
  Document new integrations.

## Testing

- **TDD**: Write tests first for features/bugs. Cover critical paths and edges.
- **Types**: Unit (Vitest), integration, E2E (Playwright). All must pass before
  commits.
- **Mocking**: Only in tests; use real data in dev/prod.
- **Manual Verification**: For UI/UX and complex flows.

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

- **Server-Side**: Handle sensitive logic in Cloudflare Workers.
- **Validation**: Sanitize all inputs; encode outputs to prevent XSS.
- **Secrets**: Use environment variables/secrets; never hardcode.
- **Auth & Rate Limiting**: Implement robust checks and limits.
- **Headers**: Set security headers in Worker or Astro.

## TypeScript Specifics

- **Strong Typing**: Explicit types for functions; use interfaces for objects.
- **RORO Pattern**: For complex parameters.
- **Error Handling**: Guard clauses, explicit errors, validation (e.g., Zod).

## Monorepo Management

- **Dependencies**: Install from root; add to specific workspaces.
- **Scripts**: Run root scripts from root; use `--filter` for workspaces.
- **Shared Code**: Import from `packages/` by name.

## Cloudflare

- **Workers**: ES modules; bindings in wrangler.jsonc.
- **Storage**: KV for caching, R2 for objects, D1 for relational, DO for
  consistency.
- **Deployment**: Use `wrangler deploy`; automate via GitHub Actions.
- **Logging**: `wrangler tail` for remote.

## Astro Specifics

- **Components**: `.astro` for core; framework files for others. Use props and
  composition.
- **Routing**: File-based in `src/pages/`; dynamic with brackets.
- **Content**: MDX/collections in `src/content/`.
- **Styling**: Scoped `<style>`; global CSS imports; Tailwind utilities.
- **Performance**: Static generation; partial hydration with `client:*`.
- **Data**: Top-level await; `getStaticPaths()` for static builds.
- **A11y**: Semantic HTML, ARIA, keyboard support.

Agents must verify adherence before finalizing changes. Reference README.md for
repo structure and commands.
