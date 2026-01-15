# Contributing

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3.0
- [Node.js](https://nodejs.org/) >= 22.0.0

## Setup

```bash
git clone https://github.com/Deepractice/ResourceX.git
cd ResourceX
bun install
```

## Commands

```bash
bun run build        # Build all packages
bun run test         # Run unit tests
bun run test:bdd     # Run BDD tests
bun run lint         # Lint code
bun run format       # Format code
bun run typecheck    # Type check
```

## Project Structure

```
ResourceX/
├── packages/
│   ├── core/           # @resourcexjs/core - Parser, handlers
│   ├── resourcex/      # resourcexjs - Main API
│   └── cli/            # @resourcexjs/cli - CLI tool
├── bdd/                # BDD tests (Cucumber)
└── turbo.json          # Turborepo config
```

## Creating a Changeset

When making changes that should be released:

```bash
bunx changeset
```

Follow the prompts to describe your changes.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `chore:` Maintenance
- `refactor:` Code refactoring
- `test:` Tests

## Pull Request

1. Create a branch from `main`
2. Make your changes
3. Add a changeset if needed
4. Submit PR to `main`
