/**
 * storexjs - Storage API for ResourceX applications.
 *
 * StoreX is for applications (Console, App gateway).
 * ResourceX is for AI agents.
 */

// Re-export store SPI types for implementors
export type { RXAStore, RXMStore, StoredRXM } from "@resourcexjs/core";
export { CASRegistry, MemoryRXAStore, MemoryRXMStore } from "@resourcexjs/core";
export type { ResourceInfo, StoreXConfig } from "./StoreX.js";
export { createStoreX, StoreX } from "./StoreX.js";
