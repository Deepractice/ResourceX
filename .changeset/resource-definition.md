---
"resourcexjs": minor
"@resourcexjs/core": minor
---

Add binary semantic handler and resource definition support:

- **Binary Semantic**: Handle raw binary resources (Buffer, Uint8Array, ArrayBuffer, number[])
- **Resource Definition**: Define custom URL shortcuts via config
  - `createResourceX({ resources: [{ name, semantic, transport, basePath }] })`
  - Use `name://location` instead of full ARP URL
- Use local HTTP server for network tests (improved CI stability)
