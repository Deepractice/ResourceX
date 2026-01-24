---
"@resourcexjs/core": minor
"@resourcexjs/type": patch
"@resourcexjs/loader": patch
"@resourcexjs/registry": patch
"resourcexjs": minor
---

refactor(core): replace RXC with RXA/RXP architecture

- Add RXA (Archive) interface for tar.gz storage/transfer
- Add RXP (Package) interface for runtime file access
- Update RXR interface: content → archive
- Rename storage file: content.tar.gz → archive.tar.gz
