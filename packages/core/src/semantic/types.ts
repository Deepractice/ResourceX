/**
 * Semantic Handler Interface
 * Responsible for resource semantics - how to resolve and deposit resources
 * Semantic orchestrates Transport primitives to handle resource structure and content
 */

import type { TransportHandler } from "../transport/types.js";

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
  resolvedAt: string;
}

/**
 * Context passed to semantic handler
 */
export interface SemanticContext {
  url: string;
  semantic: string;
  transport: string;
  location: string;
  timestamp: Date;
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
 * Semantic orchestrates Transport primitives to resolve/deposit resources
 */
export interface SemanticHandler<T = unknown> {
  /**
   * Semantic name (e.g., "text", "json", "package")
   */
  readonly name: string;

  /**
   * Resolve resource from location
   * Semantic controls how to use transport primitives to fetch and parse resource
   *
   * @param transport - Transport handler for I/O operations
   * @param location - Resource location
   * @param context - Semantic context
   */
  resolve(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<Resource<T>>;

  /**
   * Deposit resource to location
   * Semantic controls how to serialize data and use transport primitives to store
   *
   * @param transport - Transport handler for I/O operations
   * @param location - Resource location
   * @param data - Data to deposit
   * @param context - Semantic context
   */
  deposit?(
    transport: TransportHandler,
    location: string,
    data: T,
    context: SemanticContext
  ): Promise<void>;

  /**
   * Check if resource exists at location
   *
   * @param transport - Transport handler for I/O operations
   * @param location - Resource location
   * @param context - Semantic context
   */
  exists?(
    transport: TransportHandler,
    location: string,
    context: SemanticContext
  ): Promise<boolean>;

  /**
   * Delete resource at location
   *
   * @param transport - Transport handler for I/O operations
   * @param location - Resource location
   * @param context - Semantic context
   */
  delete?(transport: TransportHandler, location: string, context: SemanticContext): Promise<void>;
}
