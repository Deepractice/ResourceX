---
"resourcexjs": patch
---

fix(resourcex): add filename to FormData Blob for multipart upload

Some servers require filename in multipart form uploads. Added explicit filenames
to manifest.json and archive.tar.gz when publishing to registry.
