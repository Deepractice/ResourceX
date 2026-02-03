---
"resourcexjs": patch
---

fix: add filename to FormData blob when publishing to registry

FormData.append() without filename causes some environments to return string instead of File object, leading to "Missing manifest file" error on server side.
