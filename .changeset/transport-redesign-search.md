---
"@resourcexjs/arp": minor
"@resourcexjs/registry": minor
"resourcexjs": minor
---

feat: redesign transport interface and add registry search

**Transport Interface Redesign:**

- Simplified from 7 methods to 4: `get`, `set`, `exists`, `delete`
- Added `TransportParams` for runtime parameters
- Added `TransportResult` with metadata (type, size, modifiedAt)
- FileTransport: supports directory listing with `recursive` and `pattern` params
- HttpTransport: merges URL query params with runtime params

**Registry Search:**

- Added `search(options?)` method to Registry interface
- Supports `query`, `limit`, and `offset` options
- Returns matching RXL locators from local registry

**ARL Updates:**

- `resolve(params?)` and `deposit(data, params?)` now accept optional params
- Params are passed through to transport layer
