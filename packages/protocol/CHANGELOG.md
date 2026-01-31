# @resourcexjs/protocol

## 2.5.0

### Minor Changes

- 496c70a: ## resourcexjs

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

## 2.4.1

### Patch Changes

- 3f21f39: Sync @resourcexjs/protocol version to 2.4.0 with other packages
  - Add @resourcexjs/protocol to fixed version group in changeset config
  - Ensures all core packages maintain version parity

## 2.4.0

### Minor Changes

- 603b372: Add @resourcexjs/protocol package - HTTP API schema definitions for Registry API

  This package defines the contract between client SDK and server HTTP API:
  - Endpoint definitions (ENDPOINTS, API_VERSION)
  - Request types (PublishRequest, SearchRequest, etc.)
  - Response types (PublishResponse, SearchResponse, etc.)
  - Error codes (ERROR_CODES, ERROR_STATUS_CODES)

  Also removes deprecated packages:
  - services/registry-api (moved to Deepractice Cloud)
  - services/registry-web (moved to Deepractice Cloud)
  - services/well-known (moved to Deepractice Cloud)
  - packages/ui (not needed for core SDK)
