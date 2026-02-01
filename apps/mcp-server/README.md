# @resourcexjs/mcp-server

MCP (Model Context Protocol) server for ResourceX, enabling AI agents to discover, use, and publish AI resources.

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open protocol that enables AI models to interact with external tools and data sources. This server exposes ResourceX functionality as MCP tools, allowing AI agents like Claude to manage AI resources (prompts, tools, agents) directly.

## Installation

```bash
npm install -g @resourcexjs/mcp-server
# or
bun add -g @resourcexjs/mcp-server
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "resourcex": {
      "command": "resourcex-mcp",
      "env": {
        "RESOURCEX_REGISTRY": "https://registry.example.com"
      }
    }
  }
}
```

### VS Code (with Claude extension)

Add to your VS Code settings or `.mcp.json`:

```json
{
  "mcpServers": {
    "resourcex": {
      "command": "resourcex-mcp",
      "env": {
        "RESOURCEX_REGISTRY": "https://registry.example.com"
      }
    }
  }
}
```

### Using npx (no installation required)

```json
{
  "mcpServers": {
    "resourcex": {
      "command": "npx",
      "args": ["@resourcexjs/mcp-server"],
      "env": {
        "RESOURCEX_REGISTRY": "https://registry.example.com"
      }
    }
  }
}
```

## Environment Variables

| Variable             | Description                                   | Default        |
| -------------------- | --------------------------------------------- | -------------- |
| `RESOURCEX_REGISTRY` | Default registry URL for push/pull operations | -              |
| `RESOURCEX_PATH`     | Local storage path                            | `~/.resourcex` |

## Tools

### Consumer Tools

#### `search`

Search for AI resources by keyword.

```
search("code review")  → Find code review related prompts
search("translator")   → Find translation tools
search("")             → List all available resources
```

**Parameters:**

- `query` (string, required): Search keyword. Use empty string to list all.

**Returns:** List of matching resource locators.

---

#### `use`

Execute a resource and return its content.

```
use("hello-prompt:1.0.0")                      → Execute local resource
use("my-prompt")                               → Uses 'latest' tag
use("registry.example.com/tool:1.0.0")         → Pull from registry and execute
```

**Parameters:**

- `locator` (string, required): Resource locator in format `name:tag` or `registry/name:tag`.

**Returns:** The executed resource content (string or JSON).

---

#### `info`

Get detailed information about a resource.

```
info("my-prompt:1.0.0")
info("registry.example.com/tool:latest")
```

**Parameters:**

- `locator` (string, required): Resource locator to inspect.

**Returns:** Resource metadata including name, type, tag, registry, path, and files.

---

#### `list`

List all locally available resources.

```
list()          → List all local resources
list("prompt")  → Filter by keyword
```

**Parameters:**

- `query` (string, optional): Filter keyword to narrow results.

**Returns:** List of local resources from storage, cache, and linked directories.

---

### Author Tools

#### `add`

Add a resource from a local directory to ResourceX storage.

```
add("./my-prompt")
add("/home/user/prompts/greeting")
```

**Parameters:**

- `path` (string, required): Path to the resource directory containing `resource.json`.

**Returns:** Confirmation with the added resource locator.

**Required directory structure:**

```
my-prompt/
  resource.json    # Metadata (name, type, tag)
  content          # Resource content file
```

---

#### `push`

Publish a local resource to a remote registry.

```
push("my-prompt:1.0.0")                           → Push to default registry
push("my-prompt:1.0.0", "https://registry.com")   → Push to specific registry
```

**Parameters:**

- `locator` (string, required): Locator of the local resource to push.
- `registry` (string, optional): Target registry URL. Falls back to `RESOURCEX_REGISTRY`.

**Returns:** Confirmation with the push destination.

---

## Locator Format

ResourceX uses Go-style locators:

```
# Local resources (no registry prefix)
name:tag              → hello-prompt:1.0.0
name                  → hello-prompt (defaults to 'latest')

# Remote resources (with registry prefix)
registry/name:tag     → registry.example.com/hello-prompt:1.0.0
```

## Usage Examples

### Using Resources

```
1. search("translator")         → Find available translation resources
2. info("translator:1.0.0")     → Inspect resource details
3. use("translator:1.0.0")      → Execute and get content
```

### Publishing Resources

```
1. Create resource directory with resource.json
2. add("./my-resource")         → Add to local storage
3. push("my-resource:1.0.0")    → Publish to registry
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## License

Apache-2.0
