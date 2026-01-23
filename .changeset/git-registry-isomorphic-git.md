---
"@resourcexjs/registry": patch
---

Replace execSync git commands with isomorphic-git

- Use isomorphic-git for clone/fetch operations (no system git required)
- Add retry mechanism with exponential backoff for transient network errors
- Properly handle local paths vs remote URLs
