/**
 * ARP Error Types
 */

/**
 * Base error class for all ARP errors
 */
export class ARPError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ARPError";
  }
}

/**
 * Error thrown when ARP URL parsing fails
 */
export class ParseError extends ARPError {
  constructor(
    message: string,
    public readonly url?: string
  ) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Error thrown when transport layer fails
 */
export class TransportError extends ARPError {
  constructor(
    message: string,
    public readonly transport?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "TransportError";
  }
}

/**
 * Error thrown when semantic layer fails
 */
export class SemanticError extends ARPError {
  constructor(
    message: string,
    public readonly semantic?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "SemanticError";
  }
}
