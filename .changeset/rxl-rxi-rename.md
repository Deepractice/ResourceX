---
"@resourcexjs/core": minor
"resourcexjs": minor
"@resourcexjs/server": minor
---

Rename RXL to RXI (identifier) and introduce RXL as unified locator type

- `interface RXL` renamed to `interface RXI` (ResourceX Identifier)
- `RXR.locator` renamed to `RXR.identifier`
- New `type RXL = string` as unified locator (RXI string, directory path, or URL)
- `parse()` returns `RXI`, `format()` accepts `RXI`, `locate()` returns `RXI`
- Registry interfaces updated to use `RXI` parameter names
