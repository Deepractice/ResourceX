# Error Types API Reference

ResourceX provides a structured error hierarchy to help with error handling and debugging. This document covers all error types and best practices for handling them.

## Error Hierarchy

```
Error
├── ResourceXError (base class)
│   ├── LocatorError (RXL parsing)
│   ├── ManifestError (RXM validation)
│   ├── ContentError (RXC operations)
│   └── ResourceTypeError (type handling)
├── RegistryError (registry operations)
└── ARPError (ARP base class)
    ├── ParseError (URL parsing)
    ├── TransportError (transport operations)
    └── SemanticError (semantic operations)
```

---

## Core Errors (@resourcexjs/core)

### ResourceXError

Base error class for all ResourceX core errors.

```typescript
class ResourceXError extends Error {
  constructor(message: string, options?: ErrorOptions);
  name: "ResourceXError";
}
```

**Properties:**

| Property  | Type      | Description                                |
| --------- | --------- | ------------------------------------------ |
| `name`    | `string`  | Always `"ResourceXError"`                  |
| `message` | `string`  | Error description                          |
| `cause`   | `unknown` | Original error (if options.cause provided) |

**Example:**

```typescript
import { ResourceXError } from "@resourcexjs/core";

try {
  // Some operation
} catch (error) {
  if (error instanceof ResourceXError) {
    console.error("ResourceX error:", error.message);
  }
}
```

---

### LocatorError

Thrown when RXL (Resource Locator) parsing fails.

```typescript
class LocatorError extends ResourceXError {
  constructor(message: string, locator?: string);
  name: "LocatorError";
  readonly locator?: string;
}
```

**Properties:**

| Property  | Type                  | Description                             |
| --------- | --------------------- | --------------------------------------- |
| `name`    | `string`              | Always `"LocatorError"`                 |
| `locator` | `string \| undefined` | The locator string that failed to parse |

**Common Causes:**

- Invalid locator format
- Missing required components

**Example:**

```typescript
import { parseRXL, LocatorError } from "@resourcexjs/core";

try {
  parseRXL(""); // Empty locator
} catch (error) {
  if (error instanceof LocatorError) {
    console.error("Failed to parse locator:", error.locator);
    console.error("Reason:", error.message);
  }
}
```

---

### ManifestError

Thrown when RXM (Resource Manifest) validation fails.

```typescript
class ManifestError extends ResourceXError {
  constructor(message: string);
  name: "ManifestError";
}
```

**Common Causes:**

- Missing required fields (domain, name, type, version)
- Invalid field values

**Example:**

```typescript
import { createRXM, ManifestError } from "@resourcexjs/core";

try {
  createRXM({ name: "test" }); // Missing domain, type, version
} catch (error) {
  if (error instanceof ManifestError) {
    console.error("Manifest validation failed:", error.message);
    // "domain is required"
  }
}
```

---

### ContentError

Thrown when RXC (Resource Content) operations fail.

```typescript
class ContentError extends ResourceXError {
  constructor(message: string);
  name: "ContentError";
}
```

**Common Causes:**

- File not found in archive
- Invalid archive format
- Archive corruption

**Example:**

```typescript
import { createRXC, ContentError } from "@resourcexjs/core";

const content = await createRXC({ content: "Hello" });

try {
  await content.file("nonexistent"); // File not in archive
} catch (error) {
  if (error instanceof ContentError) {
    console.error("Content error:", error.message);
    // "file not found: nonexistent"
  }
}
```

---

## Type Errors (@resourcexjs/type)

### ResourceTypeError

Thrown when resource type handling fails.

```typescript
class ResourceTypeError extends ResourceXError {
  constructor(message: string);
  name: "ResourceTypeError";
}
```

**Common Causes:**

- Unsupported resource type
- Type already registered (conflict)
- Alias conflicts with existing type

**Example:**

```typescript
import { TypeHandlerChain, ResourceTypeError } from "@resourcexjs/type";

const chain = TypeHandlerChain.create();

try {
  // Try to resolve unsupported type
  await chain.resolve(rxrWithUnknownType);
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.error("Type error:", error.message);
    // "Unsupported resource type: unknown"
  }
}

try {
  // Try to register conflicting type
  chain.register(textType); // Already registered
} catch (error) {
  if (error instanceof ResourceTypeError) {
    console.error("Registration failed:", error.message);
    // "Type 'text' is already registered"
  }
}
```

---

## Registry Errors (@resourcexjs/registry)

### RegistryError

Thrown when registry operations fail.

```typescript
class RegistryError extends ResourceXError {
  constructor(message: string);
  name: "RegistryError";
}
```

**Common Causes:**

- Resource not found
- Read-only registry operation (link/delete on remote)
- Domain validation failure
- Well-known discovery failure
- Missing domain for remote git URL

**Example:**

```typescript
import { createRegistry, RegistryError } from "@resourcexjs/registry";

const registry = createRegistry();

try {
  await registry.get("nonexistent.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Registry error:", error.message);
    // "Resource not found: nonexistent.text@1.0.0"
  }
}

// Domain validation failure
import { createRegistry, withDomainValidation } from "@resourcexjs/registry";

const gitRegistry = new GitRegistry({
  type: "git",
  url: "git@github.com:Example/Registry.git",
});
const secured = withDomainValidation(gitRegistry, "example.com");

try {
  // Resource manifest has different domain
  await secured.get("other-domain.com/resource.text@1.0.0");
} catch (error) {
  if (error instanceof RegistryError) {
    console.error("Domain validation failed:", error.message);
    // "Untrusted domain: resource claims \"other-domain.com\" but registry only trusts \"example.com\""
  }
}
```

---

## ARP Errors (@resourcexjs/arp)

### ARPError

Base error class for all ARP errors.

```typescript
class ARPError extends Error {
  constructor(message: string, options?: ErrorOptions);
  name: "ARPError";
}
```

**Properties:**

| Property  | Type     | Description         |
| --------- | -------- | ------------------- |
| `name`    | `string` | Always `"ARPError"` |
| `message` | `string` | Error description   |

---

### ParseError

Thrown when ARP URL parsing fails.

```typescript
class ParseError extends ARPError {
  constructor(message: string, url?: string);
  name: "ParseError";
  readonly url?: string;
}
```

**Properties:**

| Property | Type                  | Description                  |
| -------- | --------------------- | ---------------------------- |
| `url`    | `string \| undefined` | The URL that failed to parse |

**Common Causes:**

- Missing `arp:` prefix
- Missing `://` separator
- Missing semantic or transport type
- Empty location

**Example:**

```typescript
import { createARP, ParseError } from "@resourcexjs/arp";

const arp = createARP();

try {
  arp.parse("invalid-url");
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Parse error:", error.message);
    console.error("URL:", error.url);
    // "Invalid ARP URL: must start with \"arp:\""
    // "invalid-url"
  }
}

try {
  arp.parse("arp:text://missing-transport");
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Parse error:", error.message);
    // "Invalid ARP URL: must have exactly 2 types (semantic:transport)"
  }
}
```

---

### TransportError

Thrown when transport layer operations fail.

```typescript
class TransportError extends ARPError {
  constructor(message: string, transport?: string, options?: ErrorOptions);
  name: "TransportError";
  readonly transport?: string;
}
```

**Properties:**

| Property    | Type                  | Description                         |
| ----------- | --------------------- | ----------------------------------- |
| `transport` | `string \| undefined` | The transport that caused the error |

**Common Causes:**

- Unsupported transport type
- Transport does not support operation (list, mkdir)
- Read-only transport (http/https set/delete)
- File system errors

**Example:**

```typescript
import { createARP, TransportError } from "@resourcexjs/arp";

const arp = createARP();

try {
  arp.parse("arp:text:unknown://location");
} catch (error) {
  if (error instanceof TransportError) {
    console.error("Transport error:", error.message);
    console.error("Transport:", error.transport);
    // "Unsupported transport type: unknown"
    // "unknown"
  }
}

try {
  const arl = arp.parse("arp:text:https://example.com/file.txt");
  await arl.delete(); // HTTP is read-only
} catch (error) {
  if (error instanceof TransportError) {
    console.error("Operation not supported:", error.message);
  }
}
```

---

### SemanticError

Thrown when semantic layer operations fail.

```typescript
class SemanticError extends ARPError {
  constructor(message: string, semantic?: string, options?: ErrorOptions);
  name: "SemanticError";
  readonly semantic?: string;
}
```

**Properties:**

| Property   | Type                  | Description                        |
| ---------- | --------------------- | ---------------------------------- |
| `semantic` | `string \| undefined` | The semantic that caused the error |

**Common Causes:**

- Unsupported semantic type
- Semantic does not support deposit operation

**Example:**

```typescript
import { createARP, SemanticError } from "@resourcexjs/arp";

const arp = createARP();

try {
  arp.parse("arp:unknown:file:///path");
} catch (error) {
  if (error instanceof SemanticError) {
    console.error("Semantic error:", error.message);
    console.error("Semantic:", error.semantic);
    // "Unsupported semantic type: unknown"
    // "unknown"
  }
}
```

---

## Error Handling Best Practices

### 1. Use Specific Error Types

Always check for the most specific error type first.

```typescript
import { ResourceXError, LocatorError, ManifestError } from "@resourcexjs/core";
import { RegistryError } from "@resourcexjs/registry";
import { ARPError, ParseError, TransportError } from "@resourcexjs/arp";

try {
  // Operation
} catch (error) {
  // Check specific types first
  if (error instanceof LocatorError) {
    console.error("Invalid locator:", error.locator);
  } else if (error instanceof ManifestError) {
    console.error("Invalid manifest:", error.message);
  } else if (error instanceof RegistryError) {
    console.error("Registry operation failed:", error.message);
  } else if (error instanceof ParseError) {
    console.error("Invalid ARP URL:", error.url);
  } else if (error instanceof TransportError) {
    console.error("Transport failed:", error.transport);
  } else if (error instanceof ResourceXError) {
    console.error("ResourceX error:", error.message);
  } else if (error instanceof ARPError) {
    console.error("ARP error:", error.message);
  } else {
    throw error; // Rethrow unknown errors
  }
}
```

### 2. Handle Async Operations

Always use try/catch with async/await.

```typescript
async function safeResolve(registry: Registry, locator: string) {
  try {
    return await registry.resolve(locator);
  } catch (error) {
    if (error instanceof RegistryError) {
      // Handle gracefully
      console.warn("Resource not available:", locator);
      return null;
    }
    throw error;
  }
}
```

### 3. Use Error Cause

Preserve error chains using the cause option.

```typescript
try {
  await someOperation();
} catch (originalError) {
  throw new RegistryError("Operation failed", { cause: originalError });
}
```

### 4. Validate Early

Check conditions before operations to provide better error messages.

```typescript
import { parseRXL, LocatorError } from "@resourcexjs/core";

function validateLocator(locator: string): void {
  try {
    const rxl = parseRXL(locator);
    if (!rxl.version) {
      throw new LocatorError("Version is required", locator);
    }
  } catch (error) {
    if (error instanceof LocatorError) {
      throw error;
    }
    throw new LocatorError("Invalid locator format", locator);
  }
}
```

### 5. Log with Context

Include relevant context when logging errors.

```typescript
import { createLogger } from "commonxjs/logger";

const logger = createLogger("myapp/registry");

try {
  await registry.resolve(locator);
} catch (error) {
  if (error instanceof RegistryError) {
    logger.error("Failed to resolve resource", {
      locator,
      error: error.message,
      stack: error.stack,
    });
  }
  throw error;
}
```

---

## Error Summary Table

| Error Class         | Package  | Common Causes                                  |
| ------------------- | -------- | ---------------------------------------------- |
| `ResourceXError`    | core     | Base class for all core errors                 |
| `LocatorError`      | core     | Invalid RXL format                             |
| `ManifestError`     | core     | Missing required manifest fields               |
| `ContentError`      | core     | File not found in archive                      |
| `ResourceTypeError` | type     | Unsupported or conflicting type                |
| `RegistryError`     | registry | Resource not found, domain validation          |
| `ARPError`          | arp      | Base class for ARP errors                      |
| `ParseError`        | arp      | Invalid ARP URL format                         |
| `TransportError`    | arp      | Transport not found or operation not supported |
| `SemanticError`     | arp      | Semantic not found or operation not supported  |
