---
"@resourcexjs/cli": minor
"@resourcexjs/mcp-server": minor
---

feat: add multi-registry management (Maven-style)

- Add `rx registry add/remove/list/default` CLI commands for managing multiple registries
- Support named registries with default flag in config.json
- Auto-migrate old single `registry` field to `registries[]` array
- First added registry automatically becomes the default
- Push command resolves `--registry` flag by name or URL
- MCP Server reads shared `~/.resourcex/config.json` for default registry
- Environment variables still take precedence as override
