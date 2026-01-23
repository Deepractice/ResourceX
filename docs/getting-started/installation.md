# Installation

## Requirements

- **Node.js** 18+ or **Bun** 1.0+
- TypeScript 5.0+ (recommended)

## Package Overview

ResourceX is distributed as multiple packages:

| Package                 | Purpose           | When to Use                         |
| ----------------------- | ----------------- | ----------------------------------- |
| `resourcexjs`           | Main package      | Most projects - includes everything |
| `@resourcexjs/core`     | Core types only   | Building custom tooling             |
| `@resourcexjs/registry` | Registry only     | Custom registry implementations     |
| `@resourcexjs/arp`      | ARP protocol only | Low-level I/O without ResourceX     |

## Install the Main Package

For most projects, install the main `resourcexjs` package:

```bash
# Using npm
npm install resourcexjs

# Using Bun (recommended)
bun add resourcexjs

# Using yarn
yarn add resourcexjs

# Using pnpm
pnpm add resourcexjs
```

This gives you access to:

- All core types (RXL, RXM, RXC, RXR)
- Registry (Local, Remote, Git)
- Type system (text, json, binary, custom)
- ARP with ResourceX integration

## Install Individual Packages

If you only need specific functionality:

```bash
# Core types only (RXL, RXM, RXC, RXR, TypeSystem)
npm install @resourcexjs/core

# Registry only (requires @resourcexjs/core)
npm install @resourcexjs/registry

# ARP only (no ResourceX integration)
npm install @resourcexjs/arp
```

## TypeScript Configuration

ResourceX uses ESM modules. Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Verify Installation

Create a test file to verify the installation:

```typescript
// test.ts
import { createRegistry, parseRXL, createRXM, createRXC } from "resourcexjs";

async function main() {
  // Parse a locator
  const rxl = parseRXL("localhost/test.text@1.0.0");
  console.log("Parsed locator:", rxl.toString());

  // Create a manifest
  const manifest = createRXM({
    domain: "localhost",
    name: "test",
    type: "text",
    version: "1.0.0",
  });
  console.log("Created manifest:", manifest.toLocator());

  // Create content
  const content = await createRXC({ content: "Hello, ResourceX!" });
  console.log("Created content");

  // Create registry
  const registry = createRegistry();
  console.log("Registry ready");

  console.log("Installation verified!");
}

main().catch(console.error);
```

Run with:

```bash
# Using Bun
bun run test.ts

# Using Node.js with tsx
npx tsx test.ts
```

## Storage Location

ResourceX stores resources in `~/.resourcex` by default:

```
~/.resourcex/
├── localhost/           # Local development resources
│   └── test.text/
│       └── 1.0.0/
│           ├── manifest.json
│           └── content.tar.gz
└── deepractice.ai/      # Cached remote resources
    └── ...
```

You can customize the storage path:

```typescript
const registry = createRegistry({ path: "./my-resources" });
```

## Next Steps

- [Quick Start](./quick-start.md) - Create and use your first resource
- [Introduction](./introduction.md) - Learn core concepts
