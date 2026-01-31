import type { RXL, RXR } from "@resourcexjs/core";

/**
 * RegistryAccessor - Resource accessor interface.
 *
 * Each node in the chain decides whether it can handle the request.
 */
export interface RegistryAccessor {
  /**
   * Accessor name (for debugging).
   */
  readonly name: string;

  /**
   * Check if this accessor can handle the given RXL.
   */
  canHandle(rxl: RXL): Promise<boolean>;

  /**
   * Get the resource.
   */
  get(rxl: RXL): Promise<RXR>;
}
