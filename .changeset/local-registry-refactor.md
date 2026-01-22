---
"@resourcexjs/registry": minor
"resourcexjs": minor
---

refactor: replace ARPRegistry with LocalRegistry

- Registry no longer depends on ARP package
- Uses Node.js `fs` module directly for local storage
- Exported class renamed: `ARPRegistry` → `LocalRegistry`
- `createRegistry()` API remains unchanged

This is Phase 1 of the remote registry support plan (see issues/015-registry-remote-support.md).
Breaking change: Direct imports of `ARPRegistry` need to be updated to `LocalRegistry`.
