---
name: resourcex-use
description: Discover, pull, and use AI resources (prompts, tools, agents) from ResourceX registry. Use when user asks to "use a prompt", "find AI resource", "search for tool", "get prompt", "resolve resource", or needs to execute an AI resource.
allowed-tools: Bash(resourcex-use:*)
---

# ResourceX Use Skill

Discover and use AI resources (prompts, tools, agents) from ResourceX registry.

## Quick start

```bash
# Search for resources
rx search code-review

# Pull resource to local cache
rx pull code-review-prompt:1.0.0

# Use/execute the resource
rx resolve code-review-prompt:1.0.0
```

## Core workflow

1. **Search**: `rx search <query>` to find resources
2. **Pull**: `rx pull <locator>` to cache locally
3. **Use**: `rx resolve <locator>` to execute

## Commands

### Discover resources

```bash
rx search <query>                    # Search by keyword
rx search prompt                     # Find all prompts
rx search "code review"              # Search phrase
```

### Pull resources

```bash
rx pull <locator>                    # Pull to local cache
rx pull code-review:1.0.0            # Pull specific version
rx pull code-review                  # Pull latest version
rx pull registry.example.com/tool:1.0.0  # Pull from specific registry
```

### Use resources

```bash
rx resolve <locator>                 # Execute resource, output result
rx resolve code-review:1.0.0         # Use specific version
rx resolve code-review               # Use latest version
```

### Get information

```bash
rx info <locator>                    # Show resource details
rx list                              # List all cached resources
```

### Cache management

```bash
rx cache list                        # List cached resources
rx cache clear                       # Clear all cache
rx cache clear <registry>            # Clear cache for specific registry
```

## Locator format

```
[registry/][path/]name[:tag]

Examples:
  my-prompt                          # Local or configured registry, latest
  my-prompt:1.0.0                    # Specific version
  registry.example.com/my-prompt     # From specific registry
  registry.example.com/my-prompt:1.0.0
```

## Example: Find and use a code review prompt

```bash
# Step 1: Search for code review resources
rx search "code review"
# Output: code-review-prompt:1.0.0, code-reviewer:2.0.0, ...

# Step 2: Get info about one
rx info code-review-prompt:1.0.0
# Output: Name, type, description, files...

# Step 3: Pull it
rx pull code-review-prompt:1.0.0

# Step 4: Use it
rx resolve code-review-prompt:1.0.0
# Output: The prompt content ready to use
```

## Example: Use resource from registry

```bash
# Pull from a specific registry
rx pull registry.deepractice.ai/assistant-prompt:1.0.0

# Use it (auto-pulls if not cached)
rx resolve registry.deepractice.ai/assistant-prompt:1.0.0
```

## Example: Offline usage

```bash
# Pull while online
rx pull important-prompt:1.0.0

# Later, even offline, can still use
rx resolve important-prompt:1.0.0
```

## Auto-pull feature

`rx resolve` automatically pulls from registry if resource not found locally:

```bash
# This works even without explicit pull
rx resolve registry.example.com/new-tool:1.0.0
# Automatically fetches, caches, and executes
```

## Tips

- Use `rx search` to discover available resources
- Pull resources for offline access
- `rx resolve` auto-pulls if needed, but explicit pull is faster for repeated use
- Check `rx info` before using to understand what a resource does
- Use specific versions (`:1.0.0`) for reproducibility
