/**
 * ARP Core Types
 *
 * ARI (Agent Resource Identifier) - Identifies resource type (semantic + transport)
 * ARL (Agent Resource Locator) - Locates a specific resource (semantic + transport + location)
 */

import type { Resource } from "./semantic/types.js";
import type { TransportParams, ListOptions } from "./transport/types.js";

/**
 * ARI - Agent Resource Identifier
 * Identifies the type of resource without specifying location
 */
export interface ARI {
  readonly semantic: string;
  readonly transport: string;
}

/**
 * ARL - Agent Resource Locator
 * Full resource locator with operations
 */
export interface ARL extends ARI {
  readonly location: string;

  /**
   * Resolve the resource
   * @param params - Optional runtime parameters passed to transport/semantic
   */
  resolve(params?: TransportParams): Promise<Resource>;

  /**
   * Deposit data to the resource
   * @param data - Data to deposit
   * @param params - Optional runtime parameters passed to transport/semantic
   */
  deposit(data: unknown, params?: TransportParams): Promise<void>;

  /**
   * Check if resource exists
   */
  exists(): Promise<boolean>;

  /**
   * Delete the resource
   */
  delete(): Promise<void>;

  /**
   * List directory contents (only supported by some transports)
   * @param options - List options (recursive, pattern filter)
   */
  list(options?: ListOptions): Promise<string[]>;

  /**
   * Create directory (only supported by some transports)
   */
  mkdir(): Promise<void>;

  /**
   * Convert to ARP URL string
   */
  toString(): string;
}
