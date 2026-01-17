/**
 * Text Semantic Handler
 * Handles plain text resources
 */

import { SemanticError } from "../errors.js";
import type { TransportHandler } from "../transport/types.js";
import type { Resource, SemanticHandler, SemanticContext, ResourceMeta } from "./types.js";

export interface TextResource extends Resource<string> {
  type: "text";
  content: string;
}

export class TextSemanticHandler implements SemanticHandler<string> {
  readonly name = "text";

  async resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<TextResource> {
    const buffer = await transport.read(location);
    const text = buffer.toString("utf-8");

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: buffer.length,
      encoding: "utf-8",
      mimeType: "text/plain",
      resolvedAt: context.timestamp.toISOString(),
    };

    return {
      type: "text",
      content: text,
      meta,
    };
  }

  async deposit(
    transport: TransportHandler,
    location: string,
    data: string,
    _context: SemanticContext
  ): Promise<void> {
    if (!transport.write) {
      throw new SemanticError(
        `Transport "${transport.name}" does not support write operation`,
        this.name
      );
    }

    const buffer = Buffer.from(data, "utf-8");
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

export const textSemantic: TextSemanticHandler = new TextSemanticHandler();
