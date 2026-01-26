/**
 * Test runner for @server tests
 *
 * Starts wrangler dev, runs tests, then cleans up.
 * Usage: bun run test-server.ts
 */
import { spawn, execSync } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";

const BDD_DIR = import.meta.dir;
const PROJECT_ROOT = join(BDD_DIR, "..");
const REGISTRY_API = join(PROJECT_ROOT, "services", "registry-api");

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(startPort, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : startPort;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${url}/api/v1/search`);
      if (response.ok) return true;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function killPort(port: number): void {
  try {
    if (process.platform === "win32") {
      execSync(
        `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`,
        {
          stdio: "ignore",
          shell: "cmd.exe",
        }
      );
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
        stdio: "ignore",
      });
    }
  } catch {
    // Ignore
  }
}

async function main(): Promise<void> {
  const port = await findAvailablePort(8787);
  console.log(`Using port ${port}`);

  // Apply migrations to local D1
  console.log("Applying D1 migrations...");
  try {
    execSync("wrangler d1 migrations apply resourcex-registry --local", {
      cwd: REGISTRY_API,
      stdio: "ignore",
    });
  } catch {
    // Migrations might already be applied
  }

  // Start wrangler dev
  console.log("Starting wrangler dev...");
  const cleanEnv = { ...process.env };
  delete cleanEnv.NODE_OPTIONS; // Avoid tsx conflict

  const wrangler = spawn("wrangler", ["dev", "--port", String(port)], {
    cwd: REGISTRY_API,
    stdio: "ignore",
    env: cleanEnv,
    detached: process.platform !== "win32",
  });

  // Cleanup on exit
  const cleanup = () => {
    console.log("\nCleaning up...");
    try {
      if (process.platform !== "win32" && wrangler.pid) {
        process.kill(-wrangler.pid, "SIGKILL");
      } else {
        wrangler.kill("SIGKILL");
      }
    } catch {
      // Ignore
    }
    killPort(port);
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  // Wait for server
  console.log("Waiting for server...");
  const ready = await waitForServer(`http://localhost:${port}`);
  if (!ready) {
    console.error("Server did not start in time");
    cleanup();
    process.exit(1);
  }
  console.log("Server ready!");

  // Run tests
  console.log("Running tests...\n");
  const cucumber = spawn(
    "node",
    ["--import", "tsx", "./node_modules/.bin/cucumber-js", "--tags", "@server"],
    {
      cwd: BDD_DIR,
      stdio: "inherit",
      env: { ...process.env, REGISTRY_SERVER_PORT: String(port) },
    }
  );

  const exitCode = await new Promise<number>((resolve) => {
    cucumber.on("close", (code) => resolve(code ?? 1));
  });

  cleanup();
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
