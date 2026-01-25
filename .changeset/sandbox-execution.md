---
"@resourcexjs/registry": minor
"@resourcexjs/type": minor
"resourcexjs": minor
---

feat: implement sandbox execution architecture

- Add ResolverExecutor for executing bundled code in SandboX
- Add ResolveContext type for sandbox-safe data passing
- Update TypeHandlerChain to only manage types (no execution)
- Bundle builtin types with real ESM code via Bun.build
- Support both ESM bundled and legacy object literal code formats
- Add srt isolator support with configurable isolation levels
- Add isolator tests for text, json, and custom types
