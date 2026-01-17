---
"@resourcexjs/core": minor
"@resourcexjs/registry": minor
"resourcexjs": minor
---

Implement ResourceType system and Registry

- Add ResourceType system with serializer/resolver and type aliases
- Add @resourcexjs/registry package with ARPRegistry implementation
- Add TypeHandlerChain for responsibility chain pattern
- Add built-in types: text (txt, plaintext), json (config, manifest), binary (bin, blob, raw)
- Remove @resourcexjs/cli package (functionality moved to AgentVM)
- Remove RXM resolver field (type determines everything)
- ARP now auto-registers default handlers

Breaking changes:

- Remove @resourcexjs/cli package
- Remove resolver field from RXM manifest
