/**
 * Transport Handlers Registry
 */

import { TransportError } from "../errors.js";

export type { TransportHandler, TransportCapabilities, ResourceStat } from "./types.js";
export { HttpTransportHandler, httpsHandler, httpHandler } from "./http.js";
export { FileTransportHandler, fileHandler } from "./file.js";
export { deepracticeHandler, type DeepracticeConfig } from "./deepractice.js";

import type { TransportHandler } from "./types.js";
import { httpsHandler, httpHandler } from "./http.js";
import { fileHandler } from "./file.js";

const handlers = new Map<string, TransportHandler>([
  ["https", httpsHandler],
  ["http", httpHandler],
  ["file", fileHandler],
]);

/**
 * Get transport handler by name
 */
export function getTransportHandler(name: string): TransportHandler {
  const handler = handlers.get(name);
  if (!handler) {
    throw new TransportError(`Unsupported transport type: ${name}`, name);
  }
  return handler;
}

/**
 * Register a custom transport handler
 */
export function registerTransportHandler(handler: TransportHandler): void {
  handlers.set(handler.name, handler);
}
