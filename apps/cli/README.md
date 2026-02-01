# @resourcexjs/cli

Command-line interface for ResourceX - the resource management protocol for AI Agents.

## Installation

```bash
npm install -g @resourcexjs/cli
```

Or with other package managers:

```bash
# pnpm
pnpm add -g @resourcexjs/cli

# yarn
yarn global add @resourcexjs/cli

# bun
bun add -g @resourcexjs/cli
```

## Quick Start

```bash
# Add a resource from local directory
rx add ./my-prompt

# Use a resource
rx use my-prompt.text@1.0.0

# List local resources
rx list

# Push to remote registry
rx config set registry https://registry.example.com
rx push my-prompt.text@1.0.0
```

## Commands

### Local Resource Management

#### `rx add <path>`

Add a resource from a local directory to local storage.

```bash
rx add ./my-prompt
```

The directory must contain a `resource.json` manifest file.

#### `rx list [query]`

List all local resources. Optionally filter by search query.

```bash
# List all resources
rx list

# Filter by name
rx list prompt
```

#### `rx info <locator>`

Show detailed information about a resource.

```bash
rx info hello.text@1.0.0
```

Output includes locator, name, type, version, and file tree.

#### `rx use <locator>`

Execute a resource and output the result.

```bash
rx use hello.text@1.0.0
```

- String results are printed to stdout
- Binary results are written to stdout
- JSON/object results are pretty-printed

#### `rx remove <locator>`

Remove a resource from local storage.

```bash
rx remove hello.text@1.0.0
```

### Development

#### `rx link <path>`

Link a resource directory for development. Changes to the source are reflected immediately.

```bash
rx link ./dev-prompt
```

#### `rx unlink <locator>`

Remove a development link.

```bash
rx unlink dev-prompt.text@1.0.0
```

### Remote Registry

#### `rx push <locator>`

Push a local resource to a remote registry.

```bash
# Use configured registry
rx push my-prompt.text@1.0.0

# Override registry
rx push my-prompt.text@1.0.0 --registry https://registry.example.com
```

Options:

- `-r, --registry <url>` - Registry URL (overrides config)

#### `rx pull <locator>`

Pull a resource from a remote registry to local cache.

```bash
# Use configured registry
rx pull hello.text@1.0.0

# Override registry
rx pull hello.text@1.0.0 --registry https://registry.example.com
```

Options:

- `-r, --registry <url>` - Registry URL (overrides config)

#### `rx search <query>`

Search resources in a remote registry.

```bash
rx search prompt

# Limit results
rx search prompt --limit 10
```

Options:

- `--limit <n>` - Maximum results (default: 20)

### Cache Management

#### `rx cache clear`

Clear cached remote resources.

```bash
# Clear all cached resources
rx cache clear

# Clear resources from specific registry
rx cache clear --registry registry.example.com
```

Options:

- `-r, --registry <host>` - Only clear resources from this registry

### Configuration

#### `rx config list`

Display current configuration.

```bash
rx config list
```

#### `rx config set <key> <value>`

Set a configuration value.

```bash
# Set default registry
rx config set registry https://registry.example.com

# Set storage path
rx config set path /custom/path
```

Valid keys:

- `path` - Local storage path (default: `~/.resourcex`)
- `registry` - Default registry URL

### Server

#### `rx server`

Start a registry API server for hosting resources.

```bash
# Start with defaults (port 3000, storage ./data)
rx server

# Custom port and storage
rx server --port 8080 --storage /var/resourcex
```

Options:

- `--port <n>` - Port to listen on (default: 3000)
- `--storage <path>` - Storage path for resources (default: `./data`)

Server endpoints:

- `GET /health` - Health check
- `POST /publish` - Publish resource
- `GET /resource/:loc` - Get manifest
- `GET /content/:loc` - Get content
- `GET /search` - Search resources

## Configuration

### Config File

Configuration is stored at `~/.resourcex/config.json`:

```json
{
  "path": "~/.resourcex",
  "registry": "https://registry.example.com"
}
```

### Environment Variables

Environment variables take precedence over config file:

- `RX_HOME` - Override storage path
- `RX_REGISTRY` - Override default registry

## Directory Structure

```
~/.resourcex/
├── config.json     # CLI configuration
├── local/          # Local resources (rx add)
├── cache/          # Cached remote resources (rx pull)
└── linked/         # Development symlinks (rx link)
```

## Locator Format

Resources use a Go-style locator format:

```
# Local resource (no registry)
name.type@version
hello.text@1.0.0

# Remote resource (with registry)
registry/name.type@version
registry.example.com/hello.text@1.0.0
```

## License

Apache-2.0
