# 💙 WeMake Monolith

WeMake's core platform monolith repository - empowering digital transformation
through AI-driven solutions.

[![License: BSL-1.1](https://img.shields.io/badge/License-BSL%201.1-blue)](LICENSE)

## About

This monolith repository houses WeMake's core platform, built with a modular
architecture that enables rapid innovation while maintaining a cohesive
codebase. We empower organizations through advanced technologies and industry
expertise to make work easier, faster, and more meaningful.

## Vision

A world where AI helps everyone reach their full potential.

## Repository Structure

```sh
monolith/
├── src/                  # Application layer components
├── packages/              # Shared packages and modules
├── modules/               # Domain-specific modules
├── config/                # Configuration files
├── scripts/               # Build and utility scripts
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## Technology Stack

- **Frontend**: TypeScript, React, Astro
- **Backend**: TypeScript
- **Database**: Cloudflare D1
- **Infrastructure**: Cloudflare Developer Platform
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js (v23.10.0+)
- Bun package manager (1.2.7)

### Installation

```sh
# Clone the repository
git clone https://github.com/WeMake-AI/monolith.git
cd monolith

# Install dependencies
bun i
```

### Development

```sh
# Start the development environment
bun run dev

# Build all packages and applications
bun run build

# Run tests
bun run test
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command              | Action                                |
| :------------------- | :------------------------------------ |
| `bun install`        | Installs dependencies                 |
| `bun format`         | Format code with Prettier             |
| `bun run lint`       | Run ESLint on entire monorepo         |
| `bun run lint:fix`   | Run ESLint with automatic fixing      |
| `bun run lint:check` | Run ESLint with zero warnings allowed |
| `bun check`          | Run TypeScript type checking          |

[Learn more about bun](https://bun.sh/docs).

## Code Quality & Linting

This project uses ESLint for code quality and consistency across the monorepo.

### ESLint Configuration

- **Configuration File**: `eslint.config.js` (ESLint 9+ flat config)
- **Supported File Types**: `.js`, `.ts`, `.tsx`, `.astro`
- **Plugins**: TypeScript ESLint, Astro ESLint
- **Rules**: Recommended + custom rules for strict code quality

### Linting Commands

```sh
# Lint entire monorepo
bun run lint

# Lint with automatic fixing
bun run lint:fix

# Strict linting (zero warnings allowed - perfect for CI)
bun run lint:check

# Lint specific workspace
bun run --cwd src/website lint

# Lint specific files
bunx eslint src/components/**/*.astro
```

### Development Workflow

1. **Before Committing**: Run `bun run lint:fix` to auto-fix issues
2. **CI/CD Integration**: Use `bun run lint:check` for strict validation
3. **IDE Integration**: Configure your editor to use the ESLint config
4. **Type Checking**: Run `bun check` for TypeScript validation

### ESLint Rules Overview

- **TypeScript**: Strict typing, explicit return types, no unused variables
- **Astro**: Astro-specific best practices and syntax validation
- **Code Style**: Object shorthand, consistent formatting
- **Best Practices**: No console.log in production, proper error handling

### Fixing Common Issues

```sh
# Fix object shorthand violations
bun run lint:fix

# Address TypeScript strict rules
# Add explicit return types to functions
# Remove unused variables and imports

# Handle Astro-specific issues
# Ensure proper component structure
# Follow Astro naming conventions
```

## Modular Architecture

This repository follows a modular monolith architecture with:

1. **Clear Boundaries**: Each module has well-defined interfaces
2. **Domain-Driven Design**: Organized around business domains
3. **Shared Infrastructure**: Common tooling and infrastructure code
4. **Internal Contracts**: Explicit contracts between modules

## Core Principles

1. **Digital-First**: Full digitization of business processes
2. **Sustainability**: Environmental and social responsibility
3. **Innovation**: Continuous learning and adaptation
4. **Impact**: Measurable long-term societal benefits

## Contact

- Website: [https://wemake.cx/](https://wemake.cx/)
- Email: `hey@wemake.cx`

---

Built with 💙 by the WeMake team.
