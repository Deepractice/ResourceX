/**
 * Binary Semantic Handler
 * Handles raw binary resources without any transformation
 */

import { SemanticError } from "../errors.js";
import type { TransportHandler } from "../transport/types.js";
import type { Resource, SemanticHandler, SemanticContext, ResourceMeta } from "./types.js";

export interface BinaryResource extends Resource<Buffer> {
  type: "binary";
  content: Buffer;
}

/**
 * Supported binary input types for deposit
 */
export type BinaryInput = Buffer | Uint8Array | ArrayBuffer | number[];

/**
 * Convert various binary input types to Buffer
 */
function toBuffer(data: BinaryInput): Buffer {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  if (Array.isArray(data)) {
    return Buffer.from(data);
  }
  throw new SemanticError(`Unsupported binary input type`, "binary");
}

export class BinarySemanticHandler implements SemanticHandler<Buffer> {
  readonly name = "binary";

  async resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<BinaryResource> {
    const buffer = await transport.read(location);

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: buffer.length,
      resolvedAt: context.timestamp.toISOString(),
    };

    return {
      type: "binary",
      content: buffer,
      meta,
    };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: BinaryInput,
    _context: SemanticContext
  ): Promise<void> {
    if (!transport.write) {
      throw new SemanticError(
        `Transport "${transport.name}" does not support write operation`,
        this.name
      );
    }

    const buffer = toBuffer(data);
    await transport.write(location, buffer);
  }

  async exists(
    transport: TransportHandler,
    location: string,
    _context: SemanticContext
  ): Promise<boolean> {
    if (transport.exists) {
      return transport.exists(location);
    }

    // Fallback: try to read
    try {
      await transport.read(location);
      return true;
    } catch {
      return false;
    }
  }

  async delete(
    transport: TransportHandler,
    location: string,
    _context: SemanticContext
  ): Promise<void> {
    if (!transport.delete) {
      throw new SemanticError(
        `Transport "${transport.name}" does not support delete operation`,
        this.name
      );
    }

    await transport.delete(location);
  }
}

export const binarySemantic: BinarySemanticHandler = new BinarySemanticHandler();
