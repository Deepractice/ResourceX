# Development Environment

This guide covers setting up your development environment for contributing to ResourceX.

## Prerequisites

### Required

- **Bun** >= 1.3.0 - Package manager and runtime
- **Node.js** >= 22.0.0 - For compatibility testing
- **Git** - Version control

### Recommended

- **VS Code** - IDE with TypeScript support
- **GitHub CLI** (`gh`) - For PR management

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Deepractice/ResourceX.git
cd ResourceX
```

### 2. Install Dependencies

```bash
bun install
```

This installs all dependencies for the monorepo, including workspace packages.

### 3. Build All Packages

```bash
bun run build
```

Uses Turborepo for optimized parallel builds.

### 4. Verify Setup

```bash
bun run test        # Unit tests
bun run test:bdd    # BDD tests
bun run typecheck   # TypeScript validation
```

## Project Structure

```
ResourceX/
├── packages/
│   ├── arp/              # @resourcexjs/arp - Low-level I/O protocol
│   ├── core/             # @resourcexjs/core - RXL, RXM, RXA, RXP, RXR
│   ├── registry/         # @resourcexjs/registry - Registry implementations
│   └── resourcex/        # resourcexjs - Main package (re-exports)
├── bdd/                  # BDD tests (Cucumber)
│   ├── features/         # .feature files
│   └── steps/            # Step definitions
├── issues/               # Design documents and issues
├── docs/                 # Documentation
└── turbo.json            # Turborepo configuration
```

## Common Commands

### Development

```bash
# Build all packages
bun run build

# Build specific package
cd packages/core && bun run build

# Watch mode (if available)
cd packages/core && bun run dev
```

### Testing

```bash
# Run all unit tests
bun run test

# Run single test file
bun test packages/core/tests/unit/locator/parse.test.ts

# Run BDD tests
bun run test:bdd

# Run BDD tests with specific tags
cd bdd && bun run test:tags "@registry"
cd bdd && bun run test:tags "@arp and @resolve"
cd bdd && bun run test:tags "not @pending"
```

### Code Quality

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Formatting
bun run format
```

## Package Manager

ResourceX uses **Bun** as the package manager. Always use Bun commands:

```bash
# Install dependencies
bun install

# Add a dependency
bun add package-name

# Add dev dependency
bun add -d package-name

# Add workspace dependency
bun add @resourcexjs/core --workspace
```

## Working with Workspaces

The monorepo uses Bun workspaces. Each package in `packages/` is a separate workspace.

### Package Dependencies

```typescript
// In packages/registry/src/index.ts
import { parseRXL, createRXM } from "@resourcexjs/core";
```

Workspace dependencies are resolved automatically during development.

### Building Order

Turborepo manages build order based on dependencies:

1. `@resourcexjs/core` (no dependencies)
2. `@resourcexjs/arp` (depends on core)
3. `@resourcexjs/registry` (depends on core)
4. `resourcexjs` (depends on all)

## IDE Setup

### VS Code Extensions

Recommended extensions:

- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** - Linting integration
- **Prettier** - Code formatting
- **Cucumber (Gherkin) Full Support** - BDD syntax highlighting

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Environment Variables

No environment variables required for basic development.

For GitHub Registry testing:

```bash
export GITHUB_TOKEN=your_personal_access_token
```

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules packages/*/node_modules
bun install
bun run build
```

### Type Errors

```bash
# Rebuild TypeScript declarations
bun run build

# Check specific package
cd packages/core && bun run typecheck
```

### Test Failures

```bash
# Run single test with verbose output
bun test packages/core/tests/unit/locator/parse.test.ts --verbose

# Run BDD tests with debug output
cd bdd && DEBUG=* bun run test:tags "@failing-tag"
```

## Next Steps

- Read [Development Workflow](./workflow.md) for the BDD-driven process
- Read [Code Conventions](./conventions.md) for coding standards
- Review [Design Documents](/docs/design/) for architecture understanding
