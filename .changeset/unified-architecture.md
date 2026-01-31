---
"resourcexjs": minor
"@resourcexjs/protocol": minor
"@resourcexjs/registry": patch
"@resourcexjs/loader": patch
---

## resourcexjs

Simplified API that hides internal objects (RXR, RXL, RXM, RXA). Users now interact only with:

- `path`: local directory (for add, publish, link)
- `locator`: resource identifier string (e.g., "hello.text@1.0.0")

### New Features

- `domain` config for default domain (default: "localhost")
- `registry` config for central registry URL
- Locator normalization: short locators use default domain
- `publish(path)` for directory → remote registry

### API Changes

- `save()` renamed to `add()`
- `get()` removed (use `resolve()` instead)
- `load()` removed (internal only now)
- Hidden internal objects from public exports

## @resourcexjs/protocol

Rewrote HTTP API protocol to match ResourceX implementation:

- `POST /resource` - create/update manifest (JSON body)
- `GET /resource?locator=xxx` - get manifest
- `HEAD /resource?locator=xxx` - check existence
- `DELETE /resource?locator=xxx` - delete resource
- `POST /content?locator=xxx` - upload archive (binary)
- `GET /content?locator=xxx` - get archive
- `GET /search?q=xxx` - search resources
