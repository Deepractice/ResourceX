import { ResourceXError } from "~/errors.js";

/**
 * Resource type related error.
 */
export class ResourceTypeError extends ResourceXError {
  constructor(message: string) {
    super(message);
    this.name = "ResourceTypeError";
  }
}
