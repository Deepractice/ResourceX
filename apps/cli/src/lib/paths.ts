/**
 * Default paths for ResourceX Client
 *
 * Directory structure:
 * ~/.resourcex/
 * ├── config.json     # CLI configuration
 * ├── local/          # Local resources (rx add)
 * ├── cache/          # Cached remote resources (rx pull)
 * └── linked/         # Development symlinks (rx link)
 *
 * Server storage is separate (--storage flag, default ./data)
 */

import { homedir } from "node:os";
import { join } from "node:path";

// Support RX_HOME environment variable for testing
export const RX_HOME = process.env.RX_HOME || join(homedir(), ".resourcex");

// Client paths
export const PATHS = {
  root: RX_HOME,
  config: join(RX_HOME, "config.json"),
  local: join(RX_HOME, "local"),
  cache: join(RX_HOME, "cache"),
  linked: join(RX_HOME, "linked"),
} as const;
