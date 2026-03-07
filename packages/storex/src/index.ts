/**
 * storexjs - Storage API for ResourceX applications.
 *
 * StoreX is for applications (Console, App gateway).
 * ResourceX is for AI agents.
 */

// SPI types — for platform implementors (R2RXAStore, DORXMStore, etc.)
export type { RXAStore, RXMStore, StoredRXM } from "@resourcexjs/core";
// Memory implementations — for testing only
export { MemoryRXAStore, MemoryRXMStore } from "@resourcexjs/core";
export type { ResourceInfo, StoreXConfig } from "./StoreX.js";
// StoreX API
export { createStoreX, StoreX } from "./StoreX.js";
