# OpenAI API Worker

A high-performance Cloudflare Worker that provides a unified API interface for
OpenAI-compatible models using OpenRouter. Built with Hono framework and
TypeScript for optimal performance and developer experience.

## 🚀 Features

- **Multi-Model Support**: Access to 200+ AI models through OpenRouter
- **High Performance**: Built on Cloudflare Workers for global edge deployment
- **Type Safety**: Full TypeScript support with strict typing
- **Analytics**: Integrated PostHog analytics for usage tracking
- **Rate Limiting**: Built-in rate limiting and quota management
- **Security**: Comprehensive security headers and CORS configuration
- **Monitoring**: Health checks and performance monitoring
- **DevOps Ready**: Complete CI/CD pipeline with automated testing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** (v1.0.0 or later) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (v18 or later) - [Install Node.js](https://nodejs.org/)
- **Wrangler CLI** -
  [Install Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### Required Accounts

- **Cloudflare Account** with Workers plan
- **OpenRouter Account** for AI model access
- **PostHog Account** for analytics (optional)
- **Neon Database** for data storage

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd platform/workers/openai-api

# Install dependencies
bun install

# Copy environment variables template
cp .dev.vars.example .dev.vars
```

### 2. Configure Environment Variables

Edit `.dev.vars` with your actual values:

```bash
# Required - OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-your-openrouter-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Required - Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Optional - Analytics Configuration
POSTHOG_API_KEY=phc_your_posthog_api_key
POSTHOG_HOST=https://app.posthog.com

# Optional - CORS and Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4321
RATE_LIMIT_PER_MINUTE=60
MAX_REQUEST_SIZE=1MB

# Optional - Logging and Debug
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false
```

### 3. Database Setup

```bash
# Run database migrations
bun run db:migrate

# Seed development data (optional)
bun run db:seed
```

### 4. Development Server

```bash
# Start development server
bun run dev

# The worker will be available at:
# http://localhost:8787
```

### 5. Verify Installation

```bash
# Test health endpoint
curl http://localhost:8787/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "environment": "development",
#   "version": "1.0.0"
# }
```

## 🏗️ Project Structure

```
workers/openai-api/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── routes/               # API route handlers
│   │   ├── chat.ts          # Chat completions endpoint
│   │   ├── models.ts        # Models listing endpoint
│   │   └── embeddings.ts    # Embeddings endpoint
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts          # Authentication middleware
│   │   ├── rateLimit.ts     # Rate limiting middleware
│   │   └── analytics.ts     # Analytics middleware
│   ├── lib/                 # Utility libraries
│   │   ├── openrouter.ts    # OpenRouter client
│   │   ├── database.ts      # Database utilities
│   │   └── validation.ts    # Request validation
│   └── types/               # TypeScript type definitions
│       ├── env.ts           # Environment types
│       ├── api.ts           # API types
│       └── database.ts      # Database types
├── migrations/              # Database migration files
│   ├── 001_initial_schema.sql
│   ├── dev_seed.sql
│   ├── prod_setup.sql
│   ├── run_migrations.sql
│   └── README.md
├── scripts/                 # Deployment and utility scripts
│   └── deploy.sh           # Manual deployment script
├── docs/                   # Documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── CICD_SECRETS.md     # CI/CD secrets guide
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── .github/                # GitHub Actions workflows
│   └── workflows/
│       └── openai-api-worker.yml
├── package.json            # Dependencies and scripts
├── wrangler.toml          # Cloudflare Workers configuration
├── tsconfig.json          # TypeScript configuration
├── .dev.vars.example      # Environment variables template
└── README.md              # This file
```

## 🔧 Development

### Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run dev:remote       # Start with remote resources

# Building
bun run build            # Build for production
bun run preview          # Preview production build

# Testing
bun run test             # Run all tests
bun run test:unit        # Run unit tests only
bun run test:integration # Run integration tests
bun run test:e2e         # Run end-to-end tests
bun run test:coverage    # Run tests with coverage

# Code Quality
bun run lint             # Lint code
bun run lint:fix         # Fix linting issues
bun run type-check       # TypeScript type checking
bun run format           # Format code with Prettier

# Database
bun run db:migrate       # Run database migrations
bun run db:seed          # Seed development data
bun run db:reset         # Reset database
bun run db:studio        # Open database studio

# Deployment
bun run deploy           # Deploy to production
bun run deploy:staging   # Deploy to staging
bun run deploy:dev       # Deploy to development
```

### Code Style and Standards

This project follows the WeMake coding standards:

- **TypeScript**: Strict typing enabled, no `any` types
- **Functional Programming**: Prefer pure functions and immutability
- **ESLint + Prettier**: Automated code formatting and linting
- **File Naming**: kebab-case for files, PascalCase for components
- **Imports**: Absolute imports from `src/` directory

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows
- **Coverage**: Maintain >80% code coverage

## 🚀 Deployment

### Automated Deployment (Recommended)

The project includes a complete CI/CD pipeline that automatically:

1. **Validates** code quality and runs tests
2. **Builds** the worker for production
3. **Deploys** to appropriate environment based on branch
4. **Verifies** deployment with health checks

**Branch Strategy**:

- `main` → Production deployment
- `staging` → Staging deployment
- `develop` → Development deployment
- Feature branches → No automatic deployment

### Manual Deployment

```bash
# Deploy to production
./scripts/deploy.sh -e production

# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy to development
./scripts/deploy.sh -e development
```

### Environment Setup

Before deploying, ensure you have:

1. **Cloudflare API Token** with Workers:Edit permissions
2. **Required secrets** configured in GitHub repository
3. **Database** properly migrated for target environment
4. **KV namespaces** created in Cloudflare dashboard

See [CICD_SECRETS.md](./docs/CICD_SECRETS.md) for detailed setup instructions.

## 📊 Monitoring and Analytics

### Health Checks

- **Endpoint**: `GET /health`
- **Checks**: Database connectivity, KV store, environment status
- **Monitoring**: Automated alerts on health check failures

### Analytics

- **PostHog Integration**: Track API usage, performance metrics
- **Custom Events**: Request patterns, error rates, model usage
- **Dashboards**: Real-time monitoring and historical analysis

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Cloudflare Logs**: Access via `wrangler tail`

## 🔒 Security

### Authentication

- **API Keys**: Secure API key validation
- **Rate Limiting**: Per-key and global rate limits
- **CORS**: Configurable cross-origin resource sharing

### Security Headers

- **CSP**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME type sniffing protection

### Data Protection

- **Encryption**: All data encrypted in transit and at rest
- **PII Handling**: Minimal data collection, automatic cleanup
- **Audit Logging**: Complete audit trail for all operations

## 🐛 Troubleshooting

### Common Issues

#### Development Server Won't Start

```bash
# Check Bun installation
bun --version

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Check environment variables
cat .dev.vars
```

#### Database Connection Issues

```bash
# Test database connection
bun run db:test

# Check database URL format
echo $DATABASE_URL

# Verify database is accessible
psql $DATABASE_URL -c "SELECT 1;"
```

#### Deployment Failures

```bash
# Check Wrangler authentication
wrangler whoami

# Validate configuration
wrangler deploy --dry-run

# Check secrets
wrangler secret list
```

#### API Errors

```bash
# Check worker logs
wrangler tail

# Test health endpoint
curl -f https://your-worker.your-subdomain.workers.dev/health

# Verify OpenRouter API key
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
# In .dev.vars
LOG_LEVEL=debug
ENABLE_DEBUG_LOGS=true

# Restart development server
bun run dev
```

### Getting Help

1. **Check Documentation**: Review API docs and deployment guides
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Enable Debug Logging**: Get detailed error information
4. **Contact Team**: Reach out to the development team

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Review Process

- All changes require code review
- Automated tests must pass
- Code coverage must be maintained
- Security review for sensitive changes

### Commit Message Format

```
type(scope): description

Optional body explaining the change

Optional footer with breaking changes
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📚 Additional Resources

- **[API Documentation](./docs/API.md)**: Complete API reference
- **[Deployment Guide](./docs/DEPLOYMENT.md)**: Detailed deployment instructions
- **[CI/CD Secrets](./docs/CICD_SECRETS.md)**: Secrets management guide
- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)**
- **[Hono Framework Docs](https://hono.dev/)**
- **[OpenRouter API Docs](https://openrouter.ai/docs)**

## 📄 License

This project is part of the WeMake platform and is proprietary software. See the
main repository for license information.

## 🆘 Support

For support and questions:

- **Documentation**: Check the docs/ directory
- **Issues**: Create a GitHub issue
- **Team Chat**: #openai-api-worker channel
- **Email**: dev-team@wemake.dev

---

**Built with ❤️ by the WeMake team**
