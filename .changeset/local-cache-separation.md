---
"@resourcexjs/registry": major
"resourcexjs": major
---

BREAKING CHANGE: Separate local and cache storage directories

## Storage Structure Changed

**Old:**

```
~/.resourcex/
└── {domain}/{path}/{name}.{type}/{version}/
```

**New:**

```
~/.resourcex/
├── local/                     # Development resources
│   └── {name}.{type}/{version}/
│
└── cache/                     # Remote cached resources
    └── {domain}/{path}/{name}.{type}/{version}/
```

## Migration

Delete `~/.resourcex` and re-link/pull resources:

```bash
rm -rf ~/.resourcex
```

## New API

- `registry.pull(locator)` - Pull resource from remote to local cache (TODO)
- `registry.publish(rxr, options)` - Publish to remote registry (TODO)

## Resolution Order

1. **local/** is checked first (development resources)
2. **cache/** is checked second (remote cached resources)
