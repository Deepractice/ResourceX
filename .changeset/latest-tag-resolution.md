---
"@resourcexjs/core": minor
"@resourcexjs/node-provider": minor
---

feat: add Docker-style "latest" tag resolution

- Add `setLatest`/`getLatest` to RXMStore interface for pointer-based latest tracking
- FileSystemRXMStore stores `.latest` pointer file alongside version manifests
- MemoryRXMStore tracks latest pointers in memory map
- CASRegistry.put() automatically updates latest pointer on every add
- CASRegistry.get()/has() transparently resolve "latest" to actual version
- Backward compatible: single-version resources resolve without pointer
- No server changes needed — CAS abstraction propagates resolution transparently
