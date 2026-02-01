<div align="center">
  <h1>ResourceX</h1>
  <p><strong>Package manager for AI resources</strong></p>
  <p>Let Claude use your prompts, tools, and agents</p>

  <p>
    <a href="https://github.com/Deepractice/ResourceX"><img src="https://img.shields.io/github/stars/Deepractice/ResourceX?style=social" alt="Stars"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/ResourceX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/resourcexjs"><img src="https://img.shields.io/npm/v/resourcexjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>
</div>

---

## Why ResourceX?

Your prompts, tools, and agent configurations are scattered across files, Notion pages, and your memory. ResourceX gives you:

- **One format** to package any AI resource
- **Version control** like npm packages
- **MCP integration** so Claude can directly use your resources

Think of it as **npm for AI resources**.

---

## Get Started in 2 Minutes

### 1. Configure MCP

**Claude Desktop** (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "resourcex": {
      "command": "npx",
      "args": ["@resourcexjs/mcp-server"]
    }
  }
}
```

**VS Code** (Claude extension settings):

```json
{
  "claude.mcpServers": {
    "resourcex": {
      "command": "npx",
      "args": ["@resourcexjs/mcp-server"]
    }
  }
}
```

### 2. Use in Claude

```
You: Search for code review resources
Claude: [calls search("code review")] Found the following resources...

You: Use code-review:1.0.0 to review this code
Claude: [calls use("code-review:1.0.0")] Let me review your code with this prompt...
```

That's it. Claude can now access and use ResourceX resources.

---

## Advanced Usage

<details>
<summary><b>Create Your Own Resource</b></summary>

```bash
# Create resource directory
mkdir my-prompt && cd my-prompt

# Create metadata
cat > resource.json << 'EOF'
{
  "name": "my-prompt",
  "type": "text",
  "version": "1.0.0"
}
EOF

# Create content
echo "You are a helpful assistant specialized in..." > content

# Add to local storage
npx @resourcexjs/cli add .
```

</details>

<details>
<summary><b>Manage Resources with CLI</b></summary>

```bash
# Install
npm install -g @resourcexjs/cli

# Common commands
rx add ./my-prompt      # Add local resource
rx list                 # List all resources
rx use name:1.0.0       # Use a resource
rx search keyword       # Search resources
rx push name:1.0.0      # Publish to registry
rx pull name:1.0.0      # Pull from registry
```

See [CLI Documentation](./apps/cli/README.md)

</details>

<details>
<summary><b>Use SDK in Code</b></summary>

```bash
npm install resourcexjs
```

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

// Add resource
await rx.add("./my-prompt");

// Use resource
const result = await rx.use("my-prompt:1.0.0");
console.log(result.content);

// Search resources
const results = await rx.search("code review");
```

See [SDK Documentation](./packages/resourcex/README.md)

</details>

<details>
<summary><b>Self-host Registry</b></summary>

```typescript
import { createRegistryServer } from "@resourcexjs/server";

const app = createRegistryServer({
  storagePath: "./data",
});

export default app; // Deploy to any platform that supports Hono
```

See [Server Documentation](./packages/server/README.md)

</details>

---

## Packages

| Package                                        | Description                 |
| ---------------------------------------------- | --------------------------- |
| [`@resourcexjs/cli`](./apps/cli)               | `rx` command-line tool      |
| [`@resourcexjs/mcp-server`](./apps/mcp-server) | MCP Server for AI Agents    |
| [`resourcexjs`](./packages/resourcex)          | SDK                         |
| [`@resourcexjs/server`](./packages/server)     | Self-hosted Registry Server |

<details>
<summary>Internal Packages (for developers)</summary>

| Package                                        | Description                          |
| ---------------------------------------------- | ------------------------------------ |
| [`@resourcexjs/core`](./packages/core)         | Core primitives (RXL, RXM, RXA, RXR) |
| [`@resourcexjs/storage`](./packages/storage)   | Storage backends                     |
| [`@resourcexjs/registry`](./packages/registry) | Registry implementations             |
| [`@resourcexjs/loader`](./packages/loader)     | Resource loading                     |
| [`@resourcexjs/type`](./packages/type)         | Type system                          |
| [`@resourcexjs/arp`](./packages/arp)           | Low-level I/O protocol               |

</details>

---

## Ecosystem

Part of the [Deepractice](https://github.com/Deepractice) AI infrastructure:

- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent framework
- **[AgentVM](https://github.com/Deepractice/AgentVM)** - AI Agent runtime
- **ResourceX** - Resource management (this project)

## License

[Apache-2.0](./LICENSE)

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Deepractice">Deepractice</a>
</div>
