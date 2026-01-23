---
"resourcexjs": minor
"@resourcexjs/arp": minor
---

refactor: move RxrTransport from arp to main package

**Breaking Change for `@resourcexjs/arp` users:**

RxrTransport is no longer exported from `@resourcexjs/arp`. Use `resourcexjs/arp` instead.

**Before:**

```typescript
import { createARP, RxrTransport } from "@resourcexjs/arp";
```

**After:**

```typescript
import { createARP, RxrTransport } from "resourcexjs/arp";
```

**What changed:**

- `@resourcexjs/arp` now only includes standard protocols (file, http, https)
- `resourcexjs/arp` provides an enhanced `createARP()` that auto-registers RxrTransport
- This resolves the circular dependency between arp and registry packages

**Benefits:**

- `@resourcexjs/arp` has no dependencies (can be used standalone)
- Registry can now use ARP for I/O without circular dependencies
- Main package provides complete ResourceX integration
