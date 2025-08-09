# Secrets Management Workflow

This guide documents the setup and management of secrets for the OpenAI API
Worker using Cloudflare secrets and local .dev.vars.

## Local Development (.dev.vars)

1. Copy `.dev.vars.example` to `.dev.vars` in the worker directory.
2. Fill in the required environment variables, such as API keys and database
   URLs.
3. Never commit `.dev.vars` to version control (it's gitignored).
4. Use `wrangler dev` to run the worker locally with these variables.

## Cloudflare Secrets (Production/Staging)

1. Use Wrangler CLI to set secrets:

   ```sh
   wrangler secret put <SECRET_NAME> --env <environment>
   ```

   Example:

   ```sh
   wrangler secret put OPENAI_API_KEY --env production
   ```

2. Secrets are bound to the worker via `wrangler.toml` under [[vars]] or
   environment-specific sections.
3. Access in code via `env.SECRET_NAME`.

## Best Practices

- Rotate secrets regularly.
- Use least privilege access.
- Monitor for secret exposure.
- Document all required secrets in `.dev.vars.example`.
