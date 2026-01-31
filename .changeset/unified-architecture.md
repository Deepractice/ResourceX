---
"resourcexjs": minor
"@resourcexjs/protocol": minor
"@resourcexjs/registry": patch
"@resourcexjs/loader": patch
---

## resourcexjs

Simplified API that hides internal objects. Users now interact only with:

- `path`: local directory (for add, push, link)
- `locator`: resource identifier string (e.g., "hello.text@1.0.0")

### New Features

- `domain` config for default domain (default: "localhost")
- `registry` config for central registry URL
- Locator normalization: short locators use default domain

### API Changes

- `push(path)` - push directory to remote registry (renamed from publish)
- `pull(locator)` - pull from remote to local cache
- Removed old `push(locator)` method
- Hidden internal objects (RXR, RXL, RXM, RXA) from public exports

## @resourcexjs/protocol

Rewrote HTTP API protocol with RESTful endpoints:

- `POST /publish` - publish resource (multipart form data)
- `GET /resource/{locator}` - get manifest
- `HEAD /resource/{locator}` - check existence
- `DELETE /resource/{locator}` - delete resource
- `GET /content/{locator}` - get content
- `GET /search?q=xxx` - search resources

Client uses push/pull (user perspective), Server uses publish (registry perspective).
