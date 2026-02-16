/**
 * Store SPI interfaces for Content-Addressable Storage.
 *
 * These interfaces are implemented by platform-specific adapters.
 */

export { computeDigest, isValidDigest } from "./digest.js";
// Memory implementations (for testing)
export { MemoryRXAStore } from "./MemoryRXAStore.js";
export { MemoryRXMStore } from "./MemoryRXMStore.js";
export type { RXAStore } from "./RXAStore.js";
export type { RXMSearchOptions, RXMStore, StoredRXM } from "./RXMStore.js";
