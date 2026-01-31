/**
 * ResourceX client wrapper for CLI
 */

import { createResourceX } from "resourcexjs";
import { getConfig } from "./config.js";

export interface ClientOptions {
  registry?: string;
}

export async function getClient(options?: ClientOptions) {
  const cfg = await getConfig();

  return createResourceX({
    path: cfg.path,
    registry: options?.registry ?? cfg.registry,
  });
}
