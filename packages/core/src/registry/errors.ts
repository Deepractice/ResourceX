import { ResourceXError } from "~/errors.js";

/**
 * Registry-specific error.
 */
export class RegistryError extends ResourceXError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RegistryError";
  }
}
