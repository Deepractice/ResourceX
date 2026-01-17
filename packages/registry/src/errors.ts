import { ResourceXError } from "@resourcexjs/core";

/**
 * Registry-specific error.
 */
export class RegistryError extends ResourceXError {
  constructor(message: string) {
    super(message);
    this.name = "RegistryError";
  }
}
