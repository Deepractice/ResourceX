import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import type { RXC } from "./types.js";
import { createRXC } from "./createRXC.js";

/**
 * Load RXC from file path or URL.
 */
export async function loadRXC(source: string): Promise<RXC> {
  // Check if it's a URL
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error(`No body in response from ${source}`);
    }
    return createRXC(response.body);
  }

  // Otherwise, treat as file path
  const nodeStream = createReadStream(source);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return createRXC(webStream);
}
