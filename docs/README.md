# 💙 WeMake Monolith

WeMake's core platform monolith repository - empowering digital transformation through AI-driven solutions.

## About

This monolith repository houses WeMake's core platform, built with a modular architecture that enables rapid innovation while maintaining a cohesive codebase. We empower organizations through advanced technologies and industry expertise to make work easier, faster, and more meaningful.

## Vision

A world where AI helps everyone reach their full potential.

## Repository Structure

```tree
monolith/
├── apps/                  # Application layer components
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
