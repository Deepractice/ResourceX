---
"@resourcexjs/arp": minor
"@resourcexjs/registry": minor
---

feat: add RxrTransport and Registry.get()

- Add `Registry.get(locator)` method to retrieve raw RXR without resolving
- Add `RxrTransport` class for accessing files inside resources via ARP protocol
- Format: `arp:{semantic}:rxr://{rxl}/{internal-path}`
- Example: `arp:text:rxr://localhost/hello.text@1.0.0/content`

Note: RxrTransport currently requires manual registration with a Registry instance.
Future work will add HTTP protocol support for automatic remote access (see issues/004-registry-http-protocol.md).
