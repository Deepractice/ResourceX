/**
 * ResourceX client wrapper for CLI
 */

import { createResourceX, setProvider } from "resourcexjs";
import { NodeProvider } from "@resourcexjs/node-provider";
import { getConfig } from "./config.js";

// Register Node.js provider
setProvider(new NodeProvider());

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
