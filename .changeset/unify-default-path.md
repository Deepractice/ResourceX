---
"@resourcexjs/node-provider": minor
"@resourcexjs/cli": minor
"@resourcexjs/mcp-server": minor
---

feat: unify default storage path to ~/.deepractice/resourcex

NodeProvider, CLI, and MCP server all default to ~/.deepractice/resourcex instead of ~/.resourcex.
This aligns with the Deepractice convention where all tools share the ~/.deepractice/ prefix.
