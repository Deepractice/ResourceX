import { createResourceX, ResourceXError } from "resourcexjs";

declare const __VERSION__: string;
const VERSION = __VERSION__;

const HELP = `
arp - Agent Resource Protocol CLI

Usage:
  arp <url>                 Resolve an ARP URL and print the content
  arp resolve <url>         Same as above
  arp parse <url>           Parse an ARP URL and print components

Options:
  -h, --help                Show this help
  -v, --version             Show version
  -j, --json                Output as JSON

Examples:
  arp "arp:text:https://example.com/file.txt"
  arp parse "arp:text:https://example.com/file.txt"
  arp resolve "arp:text:file:///path/to/file.txt" --json
`.trim();

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(VERSION);
    process.exit(0);
  }

  const jsonOutput = args.includes("-j") || args.includes("--json");
  const filteredArgs = args.filter((a) => !a.startsWith("-"));

  const command = filteredArgs[0];
  const rx = createResourceX();

  try {
    if (command === "parse") {
      const url = filteredArgs[1];
      if (!url) {
        console.error("Error: Missing ARP URL");
        process.exit(1);
      }
      const parsed = rx.parse(url);
      if (jsonOutput) {
        console.log(JSON.stringify(parsed, null, 2));
      } else {
        console.log(`semantic:  ${parsed.semantic}`);
        console.log(`transport: ${parsed.transport}`);
        console.log(`location:  ${parsed.location}`);
      }
    } else if (command === "resolve") {
      const url = filteredArgs[1];
      if (!url) {
        console.error("Error: Missing ARP URL");
        process.exit(1);
      }
      await resolve(rx, url, jsonOutput);
    } else {
      // Default: treat first arg as URL to resolve
      await resolve(rx, command, jsonOutput);
    }
  } catch (error) {
    if (error instanceof ResourceXError) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${(error as Error).message}`);
    }
    process.exit(1);
  }
}

async function resolve(rx: ReturnType<typeof createResourceX>, url: string, jsonOutput: boolean) {
  const resource = await rx.resolve(url);

  if (jsonOutput) {
    console.log(JSON.stringify(resource, null, 2));
  } else {
    console.log(resource.content);
  }
}

main();
