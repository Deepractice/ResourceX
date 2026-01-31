/**
 * Default paths for ResourceX
 *
 * Directory structure:
 * ~/.resourcex/
 * ├── config.json     # CLI configuration
 * ├── hosted/         # Local resources (rx add)
 * ├── cache/          # Cached remote resources (rx pull)
 * ├── linked/         # Development symlinks (rx link)
 * └── server/         # Registry server storage (rx server)
 */

import { homedir } from "node:os";
import { join } from "node:path";

// Support RX_HOME environment variable for testing
export const RX_HOME = process.env.RX_HOME || join(homedir(), ".resourcex");

// Paths
export const PATHS = {
  root: RX_HOME,
  config: join(RX_HOME, "config.json"),
  hosted: join(RX_HOME, "hosted"),
  cache: join(RX_HOME, "cache"),
  linked: join(RX_HOME, "linked"),
  server: join(RX_HOME, "server"),
} as const;
