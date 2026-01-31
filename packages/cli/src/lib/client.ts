/**
 * ResourceX client wrapper for CLI
 */

import { createResourceX } from "resourcexjs";
import { getConfig } from "./config.js";

export async function getClient() {
  const cfg = await getConfig();

  return createResourceX({
    path: cfg.path,
    domain: cfg.domain,
    registry: cfg.registry,
  });
}
