/**
 * Semantic Handler Interface
 * Responsible for parsing raw content into AI-usable format
 */

/**
 * Resource metadata
 */
export interface ResourceMeta {
  url: string;
  semantic: string;
  transport: string;
  location: string;
  size: number;
  encoding?: string;
  mimeType?: string;
  fetchedAt: string;
}

/**
 * Context passed to semantic handler
 */
export interface ParseContext {
  url: string;
  semantic: string;
  transport: string;
  location: string;
  fetchedAt: Date;
}

/**
 * Base resource interface
 */
export interface Resource<T = unknown> {
  type: string;
  content: T;
  meta: ResourceMeta;
}

/**
 * Semantic handler interface
 */
export interface SemanticHandler<T = unknown> {
  readonly type: string;

  /**
   * Parse raw content into structured resource
   */
  parse(content: Buffer, context: ParseContext): Resource<T>;
}
