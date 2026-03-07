---
"@resourcexjs/core": minor
"@resourcexjs/server": minor
"resourcexjs": minor
---

Add file-level access API for retrieving individual files from resources

- CASRegistry.getFile(rxi, file): lookup manifest → get blob by digest directly
- ResourceX.getFile(locator, file): user-facing API for single file retrieval
- Server GET /content/:locator?file=path: serve individual files with proper Content-Type
