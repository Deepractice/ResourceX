---
"resourcexjs": minor
---

Remove runtime register methods, unify to config-only approach:

- Remove `rx.registerTransport()` / `rx.registerSemantic()` methods
- Remove `rx.getTransport()` / `rx.getSemantic()` helper methods
- All customization now via `createResourceX()` config only
- Update documentation to reflect config-only approach
