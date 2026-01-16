/**
 * Cucumber World - Shared test context and resources
 */
import { setWorldConstructor, World, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { createServer } from "node:http";
import type { Server } from "node:http";

let testServer: Server | null = null;
let testPort: number = 0;

BeforeAll(function () {
  return new Promise<void>((resolve) => {
    // Start local HTTP server for all tests
    testServer = createServer((req, res) => {
      const url = req.url || "/";

      if (url === "/story" || url === "/en/story") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Deepractice AI story content");
        return;
      }

      if (url === "/404") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    });

    testServer.listen(0, () => {
      const addr = testServer!.address();
      testPort = typeof addr === "object" && addr ? addr.port : 0;
      resolve();
    });
  });
});

AfterAll(function () {
  return new Promise<void>((resolve) => {
    if (testServer) {
      testServer.close(() => {
        testServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
});

export class CustomWorld extends World {
  static getTestServerPort(): number {
    return testPort;
  }
}

setWorldConstructor(CustomWorld);
