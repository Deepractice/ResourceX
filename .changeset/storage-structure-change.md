---
"@resourcexjs/registry": minor
---

refactor: version as subdirectory, content.tar.gz extension

Storage structure change:

- Old: `{domain}/{name}.{type}@{version}/content`
- New: `{domain}/{name}.{type}/{version}/content.tar.gz`
