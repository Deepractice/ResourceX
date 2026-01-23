# Code Conventions

This document describes coding standards and conventions for ResourceX.

## TypeScript

### Module System

- **ESM Only**: All packages use ES modules (`"type": "module"` in package.json)
- **File Extensions**: Always include `.js` extension in imports for ESM compatibility

```typescript
// Correct
import { parseRXL } from "./parser.js";
import { createRXM } from "@resourcexjs/core";

// Incorrect
import { parseRXL } from "./parser";
```

### Path Aliases

Use `~/` alias instead of relative paths within packages:

```typescript
// Correct - Using path alias
import { LocatorError } from "~/errors.js";
import { parseRXL } from "~/locator/index.js";

// Avoid - Deep relative paths
import { LocatorError } from "../../../errors.js";
import { parseRXL } from "../../locator/index.js";
```

Path aliases are configured in each package's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

### Strict Mode

TypeScript strict mode is enabled. Follow these practices:

```typescript
// Explicit null checks
function getName(user: User | null): string {
  if (!user) {
    throw new Error("User is required");
  }
  return user.name;
}

// Avoid `any`, use `unknown` for truly unknown types
function parseData(input: unknown): Config {
  if (!isConfig(input)) {
    throw new Error("Invalid config");
  }
  return input;
}

// Type guards for runtime checks
function isConfig(value: unknown): value is Config {
  return typeof value === "object" && value !== null && "name" in value;
}
```

### Naming Conventions

| Type       | Convention       | Example            |
| ---------- | ---------------- | ------------------ |
| Files      | kebab-case       | `type-handler.ts`  |
| Classes    | PascalCase       | `LocalRegistry`    |
| Interfaces | PascalCase       | `TransportHandler` |
| Types      | PascalCase       | `ResourceType`     |
| Functions  | camelCase        | `createRegistry`   |
| Constants  | UPPER_SNAKE_CASE | `DEFAULT_PATH`     |
| Variables  | camelCase        | `manifestData`     |

### Interface vs Type

- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, or primitive aliases

```typescript
// Interface - can be extended
interface Registry {
  link(resource: RXR): Promise<void>;
  resolve(locator: string): Promise<ResolvedResource>;
}

// Type - for unions
type RegistryConfig = LocalRegistryConfig | RemoteRegistryConfig | GitRegistryConfig;

// Type - for utility types
type PartialRXM = Partial<RXM>;
```

### Error Handling

Use the project's error hierarchy:

```typescript
// Package-specific errors
import { LocatorError, ManifestError, ContentError } from "@resourcexjs/core";
import { RegistryError } from "@resourcexjs/registry";
import { ARPError, ParseError, TransportError } from "@resourcexjs/arp";

// Throwing errors
throw new LocatorError("Invalid locator format: missing name");
throw new RegistryError("Resource not found", { locator });

// Error handling
try {
  const rxr = await registry.resolve(locator);
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Registry error:", error.message);
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

### Async/Await

- Always use `async/await` over raw Promises
- Handle errors with try/catch or let them propagate

```typescript
// Correct
async function loadResource(path: string): Promise<RXR> {
  const manifest = await readManifest(path);
  const content = await readContent(path);
  return { manifest, content };
}

// Avoid
function loadResource(path: string): Promise<RXR> {
  return readManifest(path).then((manifest) =>
    readContent(path).then((content) => ({ manifest, content }))
  );
}
```

## Imports

### Import Order

1. Node.js built-in modules
2. External dependencies
3. Workspace packages
4. Internal modules (with `~/` alias)
5. Types (with `type` keyword)

```typescript
// Node.js built-ins
import { join } from "path";
import { readFile, writeFile } from "fs/promises";

// External dependencies
import { z } from "zod";

// Workspace packages
import { parseRXL, createRXM } from "@resourcexjs/core";

// Internal modules
import { buildStoragePath } from "~/utils/path.js";
import { validateManifest } from "~/validation/index.js";

// Type imports
import type { Registry, RegistryConfig } from "./types.js";
import type { RXR, RXM } from "@resourcexjs/core";
```

### Type Imports

Use `import type` for type-only imports:

```typescript
// Correct - type-only import
import type { RXR, RXM, RXL } from "@resourcexjs/core";
import type { Registry } from "./types.js";

// Avoid - mixing types with values
import { RXR, createRXM } from "@resourcexjs/core"; // RXR is type-only
```

## Testing

### Unit Tests

Located in `packages/*/tests/unit/`:

```typescript
import { describe, it, expect } from "bun:test";
import { parseRXL } from "~/locator/parse.js";

describe("parseRXL", () => {
  it("should parse simple locator", () => {
    const rxl = parseRXL("hello.text@1.0.0");
    expect(rxl.name).toBe("hello");
    expect(rxl.type).toBe("text");
    expect(rxl.version).toBe("1.0.0");
  });

  it("should throw on invalid locator", () => {
    expect(() => parseRXL("")).toThrow(LocatorError);
  });
});
```

### BDD Tests

Located in `bdd/features/` and `bdd/steps/`:

```gherkin
# bdd/features/registry/link.feature
@registry @link
Feature: Registry Link
  Link resources to local registry

  Scenario: Link a text resource
    Given a text resource "hello.text@1.0.0"
    When the resource is linked
    Then the resource should exist
```

```typescript
// bdd/steps/registry/link.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "expect";

Given("a text resource {string}", async function (locator: string) {
  this.resource = createTestResource(locator);
});

When("the resource is linked", async function () {
  await this.registry.add(this.resource);
});

Then("the resource should exist", async function () {
  const exists = await this.registry.exists(this.resource.locator);
  expect(exists).toBe(true);
});
```

### Test Tags

Use tags for selective test execution:

| Tag         | Purpose                   |
| ----------- | ------------------------- |
| `@arp`      | ARP layer tests           |
| `@registry` | Registry tests            |
| `@locator`  | Locator parsing tests     |
| `@pending`  | Tests not yet implemented |
| `@e2e`      | End-to-end tests          |

```bash
cd bdd && bun run test:tags "@registry and @link"
cd bdd && bun run test:tags "not @pending"
```

## Documentation

### JSDoc Comments

Document public APIs:

````typescript
/**
 * Parse a ResourceX locator string into its components.
 *
 * @param locator - The locator string to parse
 * @returns Parsed RXL object
 * @throws {LocatorError} If the locator format is invalid
 *
 * @example
 * ```typescript
 * const rxl = parseRXL("deepractice.ai/sean/hello.text@1.0.0");
 * console.log(rxl.domain);  // "deepractice.ai"
 * console.log(rxl.name);    // "hello"
 * ```
 */
export function parseRXL(locator: string): RXL {
  // implementation
}
````

### README Files

Each package should have a README with:

- Purpose and description
- Installation instructions
- Basic usage examples
- API overview

## Version Control

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add GitRegistry support
fix: handle missing manifest gracefully
docs: update API documentation
refactor: simplify storage path building
test: add BDD tests for registry link
chore: update dependencies
```

### Changesets

Always include a changeset for user-facing changes:

```bash
bunx changeset
```

Version rules:

- `patch` - Bug fixes, internal improvements
- `minor` - New features, enhancements, breaking changes

**Never use `major` version** - this project treats breaking changes as `minor`.

### Branch Names

```
feat/feature-name     # New features
fix/bug-description   # Bug fixes
docs/doc-changes      # Documentation
refactor/area         # Refactoring
test/test-addition    # Test additions
```

## Logging

Use `commonxjs/logger` instead of `console.log`:

```typescript
import { createLogger } from "commonxjs/logger";

const logger = createLogger("resourcex/registry");

logger.debug("Loading manifest", { path });
logger.info("Resource linked", { locator });
logger.warn("Resource not found, falling back", { locator });
logger.error("Failed to resolve", { error });
```

## SQLite

Use `commonxjs/sqlite` for cross-runtime compatibility:

```typescript
import { openDatabase } from "commonxjs/sqlite";

const db = openDatabase("./data/app.db");
db.exec("CREATE TABLE IF NOT EXISTS resources (...)");
```

## Path Utilities

Use `commonxjs/path` for cross-platform paths:

```typescript
import { getModuleDir, getPackageRoot } from "commonxjs/path";

// Current module directory
const __dirname = getModuleDir(import.meta);

// Package root
const pkgRoot = getPackageRoot(import.meta);
```

## Code Review Checklist

Before submitting a PR, verify:

- [ ] TypeScript compiles without errors (`bun run typecheck`)
- [ ] All tests pass (`bun run test && bun run test:bdd`)
- [ ] Code is linted (`bun run lint`)
- [ ] Code is formatted (`bun run format`)
- [ ] Changeset is added (if needed)
- [ ] Documentation is updated (if API changed)
- [ ] JSDoc comments for public APIs
- [ ] No `console.log` in production code
- [ ] Path aliases used instead of deep relative imports
- [ ] File extensions included in imports
