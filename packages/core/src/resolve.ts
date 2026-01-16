/**
 * Resource Operations
 * End-to-end flows for resolve/deposit/exists/delete
 *
 * New Architecture:
 * - Transport provides I/O primitives (read/write/list/exists/delete)
 * - Semantic orchestrates Transport primitives to handle resource semantics
 * - This module coordinates Transport + Semantic based on parsed URL
 */

import { parseARP } from "./parser.js";
import { getTransportHandler } from "./transport/index.js";
import { getSemanticHandler, type Resource, type SemanticContext } from "./semantic/index.js";
import { SemanticError } from "./errors.js";

/**
 * Create semantic context from parsed URL
 */
function createContext(
  url: string,
  semantic: string,
  transport: string,
  location: string
): SemanticContext {
  return {
    url,
    semantic,
    transport,
    location,
    timestamp: new Date(),
  };
}

/**
 * Resolve an ARP URL to a resource
 *
 * @example
 * const resource = await resolve("arp:text:https://example.com/file.txt");
 * // { type: "text", content: "...", meta: { ... } }
 */
export async function resolve(url: string): Promise<Resource> {
  const parsed = parseARP(url);

  const transport = getTransportHandler(parsed.transport);
  const semantic = getSemanticHandler(parsed.semantic);

  const context = createContext(url, parsed.semantic, parsed.transport, parsed.location);

  // Semantic controls the resolve flow
  return semantic.resolve(transport, parsed.location, context);
}

/**
 * Deposit data to an ARP URL
 *
 * @example
 * await deposit("arp:text:file://./data/config.txt", "hello world");
 */
export async function deposit(url: string, data: unknown): Promise<void> {
  const parsed = parseARP(url);

  const transport = getTransportHandler(parsed.transport);
  const semantic = getSemanticHandler(parsed.semantic);

  if (!semantic.deposit) {
    throw new SemanticError(
      `Semantic "${semantic.name}" does not support deposit operation`,
      parsed.semantic
    );
  }

  const context = createContext(url, parsed.semantic, parsed.transport, parsed.location);

  // Semantic controls the deposit flow
  await semantic.deposit(transport, parsed.location, data, context);
}

/**
 * Check if resource exists at ARP URL
 *
 * @example
 * const exists = await resourceExists("arp:text:file://./data/config.txt");
 */
export async function resourceExists(url: string): Promise<boolean> {
  const parsed = parseARP(url);

  const transport = getTransportHandler(parsed.transport);
  const semantic = getSemanticHandler(parsed.semantic);

  const context = createContext(url, parsed.semantic, parsed.transport, parsed.location);

  if (semantic.exists) {
    return semantic.exists(transport, parsed.location, context);
  }

  // Fallback to transport exists if semantic doesn't implement it
  if (transport.exists) {
    return transport.exists(parsed.location);
  }

  // Fallback: try to read
  try {
    await transport.read(parsed.location);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete resource at ARP URL
 *
 * @example
 * await resourceDelete("arp:text:file://./data/config.txt");
 */
export async function resourceDelete(url: string): Promise<void> {
  const parsed = parseARP(url);

  const transport = getTransportHandler(parsed.transport);
  const semantic = getSemanticHandler(parsed.semantic);

  const context = createContext(url, parsed.semantic, parsed.transport, parsed.location);

  if (semantic.delete) {
    return semantic.delete(transport, parsed.location, context);
  }

  // Fallback to transport delete
  if (!transport.delete) {
    throw new SemanticError(
      `Neither semantic "${semantic.name}" nor transport "${transport.name}" supports delete operation`,
      parsed.semantic
    );
  }

  await transport.delete(parsed.location);
}
