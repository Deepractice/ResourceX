import { When, Before } from "@cucumber/cucumber";
import { CustomWorld } from "../../support/world.js";

interface ResolveWorld {
  url: string;
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
}

Before({ tags: "@resolve" }, async function (this: ResolveWorld) {
  this.result = null;
  this.error = null;
});

When("resolve the resource", { timeout: 30000 }, async function (this: ResolveWorld) {
  try {
    const {
      createARP,
      fileTransport,
      httpsTransport,
      httpTransport,
      textSemantic,
      binarySemantic,
    } = await import("resourcexjs/arp");
    const arp = createARP({
      transports: [fileTransport, httpsTransport, httpTransport],
      semantics: [textSemantic, binarySemantic],
    });

    let url = this.url;

    // Adjust file URLs for BDD test directory
    if (url.includes("file://./")) {
      url = url.replace("file://./", `file://./bdd/`);
    }

    // Replace placeholder {{TEST_PORT}} with actual test server port
    if (url.includes("{{TEST_PORT}}")) {
      url = url.replace("{{TEST_PORT}}", String(CustomWorld.getTestServerPort()));
    }

    const arl = arp.parse(url);
    this.result = await arl.resolve();
  } catch (e) {
    this.error = e as Error;
  }
});
