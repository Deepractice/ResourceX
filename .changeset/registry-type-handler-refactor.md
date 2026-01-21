---
"@resourcexjs/type": minor
"@resourcexjs/registry": minor
"resourcexjs": minor
---

refactor: Registry owns TypeHandlerChain, resolve returns ResolvedResource

Breaking changes:

- `Registry.resolve()` now returns `ResolvedResource` instead of `RXR`
- Removed `globalTypeHandlerChain` export

New features:

- `Registry.supportType(type)` for dynamic type registration
- `ResolvedResource.resource` contains original RXR
- `TypeHandlerChain.create()` static factory method

This refactor solves the bundling issue where singleton pattern failed after bundling, causing type registration to go to a different instance than the one used for resolution.
