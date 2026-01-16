/**
 * HTTP/HTTPS Transport Handler
 * Provides read-only I/O primitives for HTTP resources
 */

import { TransportError } from "../errors.js";
import type { TransportHandler, TransportCapabilities } from "./types.js";

export class HttpTransportHandler implements TransportHandler {
  readonly name: string;
  private readonly protocol: "http" | "https";

  readonly capabilities: TransportCapabilities = {
    canRead: true,
    canWrite: false,
    canList: false,
    canDelete: false,
    canStat: false,
  };

  constructor(protocol: "http" | "https" = "https") {
    this.protocol = protocol;
    this.name = protocol;
  }

  async read(location: string): Promise<Buffer> {
    const url = `${this.protocol}://${location}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new TransportError(
          `HTTP ${response.status}: ${response.statusText} - ${url}`,
          this.name
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof TransportError) {
        throw error;
      }
      throw new TransportError(`Network error: ${url}`, this.name, {
        cause: error as Error,
      });
    }
  }

  // HTTP transport is read-only, write/list/delete are not implemented
}

export const httpsHandler: HttpTransportHandler = new HttpTransportHandler("https");
export const httpHandler: HttpTransportHandler = new HttpTransportHandler("http");
