/**
 * Text Semantic Handler
 * Handles plain text resources
 */

import { SemanticError } from "../errors.js";
import type { TransportHandler } from "../transport/types.js";
import type { Resource, ResourceMeta, SemanticContext, SemanticHandler } from "./types.js";

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
    const result = await transport.get(location, context.params);

    // Handle directory listing
    if (result.metadata?.type === "directory") {
      // Return as JSON string for text semantic
      const meta: ResourceMeta = {
        url: context.url,
        semantic: context.semantic,
        transport: context.transport,
        location: context.location,
        size: result.content.length,
        encoding: "utf-8",
        mimeType: "application/json",
        resolvedAt: context.timestamp.toISOString(),
        type: "directory",
      };

      return {
        type: "text",
        content: result.content.toString("utf-8"),
        meta,
      };
    }

    // Handle file content
    const text = result.content.toString("utf-8");
    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: result.metadata?.size ?? result.content.length,
      encoding: "utf-8",
      mimeType: "text/plain",
      resolvedAt: context.timestamp.toISOString(),
      type: "file",
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
    context: SemanticContext
  ): Promise<void> {
    const buffer = Buffer.from(data, "utf-8");

    try {
      await transport.set(location, buffer, context.params);
    } catch (error) {
      throw new SemanticError(
        `Failed to deposit text to "${location}": ${(error as Error).message}`,
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

export const textSemantic: TextSemanticHandler = new TextSemanticHandler();
