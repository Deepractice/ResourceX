/**
 * Registry Access Chain - Read-through cache pattern.
 *
 * Unified resource access through a chain of accessors:
 * 1. LinkedAccessor - Dev symlinks (highest priority)
 * 2. LocalAccessor - Local resources (no domain)
 * 3. CacheAccessor - Cached remote resources (has domain)
 * 4. RemoteAccessor - Fetch from remote (has domain, auto-cache)
 */

export type { RegistryAccessor } from "./RegistryAccessor.js";
export { RegistryAccessChain } from "./RegistryAccessChain.js";
export { LinkedAccessor } from "./LinkedAccessor.js";
export { LocalAccessor } from "./LocalAccessor.js";
export { CacheAccessor } from "./CacheAccessor.js";
export { RemoteAccessor, type RemoteFetcher } from "./RemoteAccessor.js";
