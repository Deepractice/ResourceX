# @resourcexjs/cli

Command-line interface for ResourceX - Agent Resource Protocol.

## Installation

```bash
npm install -g @resourcexjs/cli
# or
bun add -g @resourcexjs/cli
```

## Usage

```bash
# Resolve an ARP URL and print content
arp "arp:text:https://example.com/file.txt"

# Explicit resolve command
arp resolve "arp:text:https://example.com/file.txt"

# Parse URL without fetching
arp parse "arp:text:https://example.com/file.txt"
```

## Options

| Option          | Description    |
| --------------- | -------------- |
| `-h, --help`    | Show help      |
| `-v, --version` | Show version   |
| `-j, --json`    | Output as JSON |

## Examples

### Fetch remote text

```bash
$ arp "arp:text:https://example.com/"
<!doctype html>
<html>
...
```

### Fetch local file

```bash
$ arp "arp:text:file:///path/to/file.txt"
Hello, World!
```

### Parse URL components

```bash
$ arp parse "arp:text:https://example.com/file.txt"
semantic:  text
transport: https
location:  example.com/file.txt
```

### JSON output

```bash
$ arp "arp:text:file:///tmp/test.txt" --json
{
  "type": "text",
  "content": "Hello, World!",
  "meta": {
    "url": "arp:text:file:///tmp/test.txt",
    "semantic": "text",
    "transport": "file",
    "location": "/tmp/test.txt",
    "size": 13,
    "encoding": "utf-8",
    "fetchedAt": "2025-01-15T03:22:07.917Z"
  }
}
```

## ARP URL Format

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: Resource type (`text`, etc.)
- **transport**: Protocol (`https`, `http`, `file`)
- **location**: Resource location

## License

MIT
