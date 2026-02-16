/**
 * Binary Semantic Handler
 * Handles raw binary resources without any transformation
 */

import { SemanticError } from "../errors.js";
import type { TransportHandler } from "../transport/types.js";
import type { Resource, ResourceMeta, SemanticContext, SemanticHandler } from "./types.js";

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
    const result = await transport.get(location, context.params);

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: result.metadata?.size ?? result.content.length,
      resolvedAt: context.timestamp.toISOString(),
      type: result.metadata?.type,
    };

    return {
      type: "binary",
      content: result.content,
      meta,
    };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: BinaryInput,
    context: SemanticContext
  ): Promise<void> {
    const buffer = toBuffer(data);

    try {
      await transport.set(location, buffer, context.params);
    } catch (error) {
      throw new SemanticError(
        `Failed to deposit binary to "${location}": ${(error as Error).message}`,
        this.name,
        { cause: error as Error }
      );
    }
  }

  async exists(
    transport: TransportHandler,
    location: string,
    _context: SemanticContext
  ): Promise<boolean> {
    return transport.exists(location);
  }

  async delete(
    transport: TransportHandler,
    location: string,
    _context: SemanticContext
  ): Promise<void> {
    try {
      await transport.delete(location);
    } catch (error) {
      throw new SemanticError(
        `Failed to delete "${location}": ${(error as Error).message}`,
        this.name,
        { cause: error as Error }
      );
    }
  }
}

export const binarySemantic: BinarySemanticHandler = new BinarySemanticHandler();
