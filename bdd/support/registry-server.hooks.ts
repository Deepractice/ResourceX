/**
 * Registry API Server hooks for BDD tests
 *
 * Server is started by scripts/test-server.sh
 * This file just provides the URL getter.
 */

let registryServerPort = parseInt(process.env.REGISTRY_SERVER_PORT || "8787", 10);

// Export for use in step definitions
export function getRegistryServerUrl(): string {
  return `http://localhost:${registryServerPort}`;
}
