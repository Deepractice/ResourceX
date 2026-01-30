# @resourcexjs/protocol

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
