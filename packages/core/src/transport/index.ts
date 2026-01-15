/**
 * Transport Handlers Registry
 */

import { TransportError } from "../errors.js";

export type { TransportHandler } from "./types.js";
export { HttpTransportHandler, httpsHandler, httpHandler } from "./http.js";
export { FileTransportHandler, fileHandler } from "./file.js";

import type { TransportHandler } from "./types.js";
import { httpsHandler, httpHandler } from "./http.js";
import { fileHandler } from "./file.js";

const handlers = new Map<string, TransportHandler>([
  ["https", httpsHandler],
  ["http", httpHandler],
  ["file", fileHandler],
]);

/**
 * Get transport handler by type
 */
export function getTransportHandler(type: string): TransportHandler {
  const handler = handlers.get(type);
  if (!handler) {
    throw new TransportError(`Unsupported transport type: ${type}`, type);
  }
  return handler;
}

/**
 * Register a custom transport handler
 */
export function registerTransportHandler(handler: TransportHandler): void {
  handlers.set(handler.type, handler);
}
