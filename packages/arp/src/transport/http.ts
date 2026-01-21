/**
 * HTTP/HTTPS Transport Handler
 * Provides read-only I/O primitives for HTTP resources
 *
 * Location format: hostname/path?query
 * Runtime params are merged with URL query params (runtime params override)
 */

import { TransportError } from "../errors.js";
import type { TransportHandler, TransportResult, TransportParams } from "./types.js";

export class HttpTransportHandler implements TransportHandler {
  readonly name: string;
  private readonly protocol: "http" | "https";

  constructor(protocol: "http" | "https" = "https") {
    this.protocol = protocol;
    this.name = protocol;
  }

  /**
   * Get content from HTTP URL
   * Merges runtime params with URL query params
   */
  async get(location: string, params?: TransportParams): Promise<TransportResult> {
    const url = this.buildUrl(location, params);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new TransportError(
          `HTTP ${response.status}: ${response.statusText} - ${url}`,
          this.name
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);

      // Extract metadata from headers
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");
      const lastModified = response.headers.get("last-modified");

      return {
        content,
        metadata: {
          type: "file",
          size: contentLength ? parseInt(contentLength, 10) : content.length,
          modifiedAt: lastModified ? new Date(lastModified) : undefined,
          contentType,
        },
      };
    } catch (error) {
      if (error instanceof TransportError) {
        throw error;
      }
      throw new TransportError(`Network error: ${url}`, this.name, {
        cause: error as Error,
      });
    }
  }

  /**
   * Build URL with merged params
   */
  private buildUrl(location: string, params?: TransportParams): string {
    const url = new URL(`${this.protocol}://${location}`);

    // Merge runtime params (override existing)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  /**
   * HTTP transport is read-only, set is not supported
   */
  async set(_location: string, _content: Buffer, _params?: TransportParams): Promise<void> {
    throw new TransportError("HTTP transport is read-only, set not supported", this.name);
  }

  /**
   * Check if HTTP resource exists (HEAD request)
   */
  async exists(location: string): Promise<boolean> {
    const url = `${this.protocol}://${location}`;

    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * HTTP transport is read-only, delete is not supported
   */
  async delete(_location: string): Promise<void> {
    throw new TransportError("HTTP transport is read-only, delete not supported", this.name);
  }
}

export const httpsTransport: HttpTransportHandler = new HttpTransportHandler("https");
export const httpTransport: HttpTransportHandler = new HttpTransportHandler("http");
