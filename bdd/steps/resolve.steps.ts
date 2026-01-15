import { When, Before } from "@cucumber/cucumber";

interface ResolveWorld {
  url: string;
  result: { type: string; content: unknown; meta?: Record<string, unknown> } | null;
  error: Error | null;
}

Before({ tags: "@resolve" }, async function (this: ResolveWorld) {
  this.result = null;
  this.error = null;
});

When("resolve the resource", async function (this: ResolveWorld) {
  try {
    const { createResourceX } = await import("resourcexjs");
    const rx = createResourceX();
    let url = this.url;
    if (url.includes("file://./")) {
      url = url.replace("file://./", `file://./bdd/`);
    }
    this.result = await rx.resolve(url);
  } catch (e) {
    this.error = e as Error;
  }
});
