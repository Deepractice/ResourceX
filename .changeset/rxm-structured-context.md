---
"@resourcexjs/core": minor
"resourcexjs": minor
"@resourcexjs/server": minor
"@resourcexjs/cli": minor
"@resourcexjs/mcp-server": minor
---

feat: restructure RXM as definition/archive/source context

BREAKING CHANGE: RXM and Resource interfaces restructured from flat to nested.

- RXM now has three sections: `definition`, `archive`, `source`
- `definition` includes metadata from RXD: description, author, license, keywords, repository
- `source.files` is a structured FileTree with sizes (replaces flat string array)
- `source.preview` provides first 500 chars of primary content file
- `archive` is an empty placeholder for future packaging metadata (digest, md5)
- All field access changes from `manifest.name` to `manifest.definition.name`
- StoredRXM now persists extended definition fields
- CLI and MCP info commands show structured file tree with sizes and preview
