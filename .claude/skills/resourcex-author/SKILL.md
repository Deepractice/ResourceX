---
name: resourcex-author
description: Create, develop, and publish AI resources (prompts, tools, agents) to ResourceX registry. Use when user asks to "create a prompt", "publish resource", "develop AI tool", "share prompt", or mentions "resourcex", "rx add", "rx push".
allowed-tools: Bash(resourcex-author:*), Read, Write, Edit
---

# ResourceX Author Skill

Create and publish AI resources (prompts, tools, agents) to ResourceX registry.

## Quick start

```bash
# Create resource directory
mkdir my-prompt && cd my-prompt

# Create resource.json
echo '{"name":"my-prompt","type":"text","tag":"1.0.0"}' > resource.json

# Create content
echo 'You are a helpful assistant...' > content

# Add to local storage
rx add .

# Test locally
rx resolve my-prompt:1.0.0

# Publish to registry
rx push my-prompt:1.0.0 --registry https://registry.example.com
```

## Core workflow

1. **Create**: Make directory with `resource.json` + content files
2. **Add**: `rx add ./path` to local storage
3. **Test**: `rx resolve name:tag` to verify
4. **Iterate**: `rx link ./path` for live development
5. **Publish**: `rx push name:tag` to registry

## Resource structure

```
my-prompt/
├── resource.json    # Required: metadata
└── content          # Required: main content (or any files)
```

### resource.json format

```json
{
  "name": "my-prompt",
  "type": "text",
  "tag": "1.0.0",
  "description": "A helpful assistant prompt",
  "author": "your-name",
  "license": "MIT"
}
```

**Required fields:**

- `name`: Resource identifier (lowercase, hyphens allowed)
- `type`: Resource type (`text`, `json`, `binary`, or custom)

**Optional fields:**

- `tag`: Version tag (default: `latest`)
- `registry`: Target registry domain
- `path`: Namespace path (e.g., `tools/ai`)
- `description`, `author`, `license`, `keywords`

## Commands

### Local operations

```bash
rx add ./my-prompt              # Add directory to local storage
rx link ./my-prompt             # Link for live development (changes reflect immediately)
rx unlink my-prompt:1.0.0       # Remove development link
rx list                         # List all local resources
rx info my-prompt:1.0.0         # Show resource details
rx resolve my-prompt:1.0.0      # Execute/test resource
rx remove my-prompt:1.0.0       # Remove from local storage
```

### Remote operations

```bash
rx push my-prompt:1.0.0                              # Push to configured registry
rx push my-prompt:1.0.0 --registry https://...       # Push to specific registry
rx search my-prompt                                  # Search registry
```

### Configuration

```bash
rx config list                                       # Show current config
rx config set registry https://registry.example.com # Set default registry
```

## Development workflow with link

`rx link` creates a symlink for rapid iteration - changes are reflected immediately without re-adding.

```bash
# Start development
rx link ./my-prompt
rx resolve my-prompt:1.0.0    # See current content

# Edit content file...
rx resolve my-prompt:1.0.0    # See changes immediately

# When satisfied, finalize
rx add ./my-prompt            # Snapshot to local storage
rx unlink my-prompt:1.0.0     # Remove dev link
rx push my-prompt:1.0.0       # Publish
```

## Example: Create a code review prompt

```bash
# Step 1: Create directory structure
mkdir code-review-prompt
cd code-review-prompt

# Step 2: Create resource.json
cat > resource.json << 'EOF'
{
  "name": "code-review-prompt",
  "type": "text",
  "tag": "1.0.0",
  "description": "AI code review assistant prompt"
}
EOF

# Step 3: Create content
cat > content << 'EOF'
You are an expert code reviewer. Review the provided code for:
1. Bugs and potential issues
2. Performance improvements
3. Code style and best practices
4. Security vulnerabilities

Provide specific, actionable feedback with code examples.
EOF

# Step 4: Add and test
rx add .
rx resolve code-review-prompt:1.0.0

# Step 5: Publish
rx push code-review-prompt:1.0.0 --registry https://registry.example.com
```

## Example: Iterate with link

```bash
# Link for development
rx link ./code-review-prompt

# Test
rx resolve code-review-prompt:1.0.0

# Edit content (in another terminal or editor)
# Changes reflect immediately on next resolve

# Finalize when ready
rx add ./code-review-prompt
rx unlink code-review-prompt:1.0.0
rx push code-review-prompt:1.0.0
```

## Resource types

| Type     | Description                    | Content format |
| -------- | ------------------------------ | -------------- |
| `text`   | Plain text, prompts            | UTF-8 text     |
| `json`   | Configuration, structured data | JSON           |
| `binary` | Images, compiled assets        | Any binary     |

## Locator format

```
[registry/][path/]name[:tag]

Examples:
  my-prompt                      # Local, latest tag
  my-prompt:1.0.0               # Local, specific tag
  registry.example.com/my-prompt:1.0.0  # Remote
  registry.example.com/tools/my-prompt:1.0.0  # Remote with path
```

## Tips

- Use `rx link` during development for instant feedback
- Test with `rx resolve` before publishing
- Use semantic versioning for tags (1.0.0, 1.1.0, 2.0.0)
- Add description and keywords for discoverability
