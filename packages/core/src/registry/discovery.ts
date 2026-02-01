/**
 * Well-known discovery for ResourceX registries.
 */

import { RegistryError } from "./errors.js";

/**
 * Well-known discovery response format.
 */
export interface WellKnownResponse {
  version?: string;
  registries: string[];
}

/**
 * Result from discoverRegistry().
 */
export interface DiscoveryResult {
  domain: string;
  registries: string[];
}

/**
 * Discover registry for a domain using well-known.
 * @param domain - The domain to discover (e.g., "deepractice.ai")
 * @returns Discovery result with domain and authorized registries
 */
export async function discoverRegistry(domain: string): Promise<DiscoveryResult> {
  const wellKnownUrl = `https://${domain}/.well-known/resourcex`;

  try {
    const response = await fetch(wellKnownUrl);
    if (!response.ok) {
      throw new RegistryError(`Well-known discovery failed for ${domain}: ${response.statusText}`);
    }

    const data = (await response.json()) as WellKnownResponse;

    if (!data.registries || !Array.isArray(data.registries) || data.registries.length === 0) {
      throw new RegistryError(
        `Invalid well-known response for ${domain}: missing or empty registries`
      );
    }

    return {
      domain,
      registries: data.registries,
    };
  } catch (error) {
    if (error instanceof RegistryError) {
      throw error;
    }
    throw new RegistryError(
      `Failed to discover registry for ${domain}: ${(error as Error).message}`
    );
  }
}
