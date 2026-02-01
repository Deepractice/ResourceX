/**
 * ResourceX MCP Server Instructions
 *
 * This is added to the AI's system prompt to provide context
 * about the server's purpose and how to use it.
 */

export const instructions = `
# ResourceX MCP Server

ResourceX is a package manager for AI resources (prompts, tools, agents), similar to npm for code packages.

## Core Concepts

- **locator**: Resource identifier
  - Local: \`name:tag\` (e.g., \`hello-prompt:1.0.0\`)
  - Remote: \`registry/name:tag\` (e.g., \`registry.example.com/hello-prompt:1.0.0\`)
- **tag**: Version tag, defaults to \`latest\` if omitted

## Available Tools

### Consumer Tools (Using Resources)

\`\`\`
search("code review")           → Find resources by keyword
                                → Returns list of locators

use("code-review:1.0.0")        → Execute resource, return content
                                → Auto-pulls from registry if needed

list()                          → List all local resources
list("prompt")                  → Filter by keyword

info("my-prompt:1.0.0")         → Get resource details (type, files, etc.)
\`\`\`

### Author Tools (Publishing)

\`\`\`
push("my-prompt:1.0.0")         → Publish to configured registry
push("my-prompt:1.0.0", "http://...") → Publish to specific registry
\`\`\`

Note: Creating resources (directory structure, resource.json) should be done
using the resourcex-author skill or CLI commands before pushing.

## Typical Workflows

### Using a Resource

\`\`\`
1. search("translator")         → Find available resources
2. info("translator:1.0.0")     → Check details (optional)
3. use("translator:1.0.0")      → Use it
\`\`\`

### Publishing a Resource

\`\`\`
1. Create resource using resourcex-author skill or CLI
2. push("my-resource:1.0.0")    → Publish to registry
\`\`\`
`.trim();
