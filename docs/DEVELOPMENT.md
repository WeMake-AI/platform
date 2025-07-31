# Development Guide

This guide covers development workflows, code quality standards, and best
practices for the WeMake platform monorepo.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Quality & Linting](#code-quality--linting)
- [Development Workflow](#development-workflow)
- [Monorepo Structure](#monorepo-structure)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- Node.js 18+ (for compatibility)
- Git

### Initial Setup

```sh
# Clone the repository
git clone https://github.com/WeMake-AI/monolith.git
cd monolith

# Install dependencies
bun install

# Verify setup
bun run lint:check
bun check
```

## Code Quality & Linting

### ESLint Configuration

The project uses ESLint 9+ with flat configuration (`eslint.config.js`) for
consistent code quality across the monorepo.

#### Configuration Structure

```javascript
// eslint.config.js
export default [
  // Base configuration for all files
  {
    files: ["**/*.{js,ts,tsx,astro}"]
    // ... base rules
  },

  // TypeScript-specific configuration
  {
    files: ["**/*.{ts,tsx}"]
    // ... TypeScript rules without type-checking
  },

  // Type-aware TypeScript rules for source files only
  {
    files: ["apps/*/src/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"]
    // ... type-aware rules
  },

  // Astro-specific configuration
  {
    files: ["**/*.astro"]
    // ... Astro rules
  }
];
```

#### Supported File Types

- **JavaScript**: `.js` files
- **TypeScript**: `.ts`, `.tsx` files
- **Astro**: `.astro` files
- **Configuration**: `.json`, `.md` files (basic rules)

#### Key Plugins

- `@typescript-eslint/eslint-plugin`: TypeScript-specific rules
- `eslint-plugin-astro`: Astro component linting
- `@typescript-eslint/parser`: TypeScript parsing
- `astro-eslint-parser`: Astro file parsing

### Linting Commands

#### Root Level Commands

```sh
# Lint entire monorepo
bun run lint

# Lint with automatic fixing
bun run lint:fix

# Strict linting (zero warnings allowed)
bun run lint:check
```

#### Workspace-Specific Commands

```sh
# Lint specific workspace
bun run --cwd apps/website lint
bun run --cwd apps/website lint:fix
bun run --cwd apps/website lint:check
```

#### Direct ESLint Usage

```sh
# Lint specific files
bunx eslint src/components/**/*.astro

# Lint with custom options
bunx eslint apps/website/src --ext .ts,.tsx,.astro

# Fix specific files
bunx eslint src/utils/helpers.ts --fix
```

### ESLint Rules Overview

#### TypeScript Rules

- **Type Safety**: Strict typing, explicit return types
- **Code Quality**: No unused variables, consistent naming
- **Best Practices**: Proper error handling, no any types

#### Astro Rules

- **Component Structure**: Proper Astro component syntax
- **Performance**: Optimized component patterns
- **Accessibility**: A11y best practices

#### General Rules

- **Code Style**: Object shorthand, consistent formatting
- **Performance**: No console.log in production
- **Security**: Safe coding practices

## Development Workflow

### Daily Development

1. **Start Development**

   ```sh
   bun run dev
   ```

2. **Before Committing**

   ```sh
   # Fix auto-fixable issues
   bun run lint:fix

   # Check for remaining issues
   bun run lint:check

   # Verify TypeScript
   bun check
   ```

3. **Commit Changes**

   ```sh
   git add .
   git commit -m "feat: add new feature"
   ```

### Code Review Process

1. **Pre-Review Checklist**
   - [ ] All linting issues resolved
   - [ ] TypeScript compilation successful
   - [ ] Tests passing
   - [ ] Documentation updated

2. **Review Guidelines**
   - Focus on business logic and architecture
   - ESLint handles code style automatically
   - Verify test coverage for new features

### IDE Integration

#### VS Code Setup

1. Install ESLint extension
2. Add to `.vscode/settings.json`:

   ```json
   {
     "eslint.experimental.useFlatConfig": true,
     "eslint.validate": ["javascript", "typescript", "astro"],
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

## Monorepo Structure

### Workspace Organization

```sh
platform/
├── apps/
│   └── website/          # Astro website application
├── packages/             # Shared packages
├── docs/                 # Documentation
├── eslint.config.js      # ESLint configuration
├── package.json          # Root package.json
└── bun.lockb            # Bun lockfile
```

### Package.json Scripts

#### Root Level

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:check": "eslint . --max-warnings 0"
  }
}
```

#### Workspace Level

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:check": "eslint . --max-warnings 0"
  }
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run ESLint
        run: bun run lint:check

      - name: TypeScript Check
        run: bun check
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "bun run lint:check && bun check"
    }
  }
}
```

## Troubleshooting

### Common ESLint Issues

#### Type Information Required

**Error**:
`Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser`

**Solution**: Ensure TypeScript project configuration is correct:

```javascript
// eslint.config.js
{
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.json", "./apps/*/tsconfig.json"];
    }
  }
}
```

#### Astro Parsing Issues

**Error**: `Parsing error: Unexpected token`

**Solution**: Verify Astro parser configuration:

```javascript
{
  files: ['**/*.astro'],
  languageOptions: {
    parser: astroEslintParser,
    parserOptions: {
      parser: '@typescript-eslint/parser',
      extraFileExtensions: ['.astro']
    }
  }
}
```

#### Performance Issues

**Issue**: ESLint running slowly on large codebase

**Solutions**:

1. Use `.eslintignore` for build artifacts
2. Limit type-aware rules to source files only
3. Use `--cache` flag for faster subsequent runs

### Getting Help

1. **Check Documentation**: Review this guide and ESLint docs
2. **Run Diagnostics**: Use `bunx eslint --debug` for detailed output
3. **Team Support**: Ask in development channels
4. **Issue Tracking**: Create GitHub issues for persistent problems

---

## Best Practices Summary

- ✅ Run `bun run lint:fix` before committing
- ✅ Use `bun run lint:check` in CI/CD
- ✅ Configure IDE for real-time linting
- ✅ Keep ESLint configuration up to date
- ✅ Document custom rules and exceptions
- ✅ Regular dependency updates
- ✅ Monitor performance impact of rules

For more information, see the [main README](../README.md) or contact the
development team.
