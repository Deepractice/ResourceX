/**
 * HTTP/HTTPS Transport Handler
 */

import { TransportError } from "../errors.js";
import type { TransportHandler } from "./types.js";

export class HttpTransportHandler implements TransportHandler {
  readonly type: string;
  private readonly protocol: "http" | "https";

  constructor(protocol: "http" | "https" = "https") {
    this.protocol = protocol;
    this.type = protocol;
  }

  async fetch(location: string): Promise<Buffer> {
    const url = `${this.protocol}://${location}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new TransportError(
          `HTTP ${response.status}: ${response.statusText} - ${url}`,
          this.type
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof TransportError) {
        throw error;
      }
      throw new TransportError(`Network error: ${url}`, this.type, { cause: error as Error });
    }
  }
}

export const httpsHandler: HttpTransportHandler = new HttpTransportHandler("https");
export const httpHandler: HttpTransportHandler = new HttpTransportHandler("http");
