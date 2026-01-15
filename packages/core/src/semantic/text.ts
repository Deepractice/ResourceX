/**
 * Text Semantic Handler
 * Handles plain text resources
 */

import type { Resource, SemanticHandler, ParseContext, ResourceMeta } from "./types.js";

export interface TextResource extends Resource<string> {
  type: "text";
  content: string;
}

export class TextSemanticHandler implements SemanticHandler<string> {
  readonly type = "text";

  parse(content: Buffer, context: ParseContext): TextResource {
    const text = content.toString("utf-8");

    const meta: ResourceMeta = {
      url: context.url,
      semantic: context.semantic,
      transport: context.transport,
      location: context.location,
      size: content.length,
      encoding: "utf-8",
      mimeType: "text/plain",
      fetchedAt: context.fetchedAt.toISOString(),
    };

    return {
      type: "text",
      content: text,
      meta,
    };
  }
}

export const textHandler: TextSemanticHandler = new TextSemanticHandler();
