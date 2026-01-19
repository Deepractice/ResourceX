/**
 * ResourceX Error hierarchy
 */

export class ResourceXError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ResourceXError";
  }
}

export class LocatorError extends ResourceXError {
  constructor(
    message: string,
    public readonly locator?: string
  ) {
    super(message);
    this.name = "LocatorError";
  }
}

export class ManifestError extends ResourceXError {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export class ContentError extends ResourceXError {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}
