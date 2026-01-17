/**
 * ARP Core Types
 *
 * ARI (Agent Resource Identifier) - Identifies resource type (semantic + transport)
 * ARL (Agent Resource Locator) - Locates a specific resource (semantic + transport + location)
 */

import type { Resource } from "./semantic/types.js";

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
   */
  resolve(): Promise<Resource>;

  /**
   * Deposit data to the resource
   */
  deposit(data: unknown): Promise<void>;

  /**
   * Check if resource exists
   */
  exists(): Promise<boolean>;

  /**
   * Delete the resource
   */
  delete(): Promise<void>;

  /**
   * Convert to ARP URL string
   */
  toString(): string;
}
