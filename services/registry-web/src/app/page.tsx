"use client";

import Link from "next/link";
import { Button, SearchBox, ResourceCard } from "@resourcexjs/ui";
import { parseLocator } from "~/lib/api";

// Mock data for now - will be replaced with real API calls
const mockResources = [
  {
    locator: "deepractice.ai/sean/assistant-prompt.prompt@1.2.0",
    description: "AI assistant prompt for conversational interactions with context awareness.",
    downloads: 1200,
  },
  {
    locator: "deepractice.ai/code-reviewer.tool@0.5.1",
    description: "Automated code review tool with AI-powered suggestions.",
    downloads: 890,
  },
  {
    locator: "deepractice.ai/translator-agent.agent@1.1.0",
    description: "Multi-language translation agent with context understanding.",
    downloads: 650,
  },
  {
    locator: "deepractice.ai/summarizer.prompt@0.9.5",
    description: "Text summarization prompt with adjustable length parameters.",
    downloads: 420,
  },
  {
    locator: "deepractice.ai/api-client.tool@1.0.0",
    description: "API client configuration with retry and timeout settings.",
    downloads: 380,
  },
  {
    locator: "deepractice.ai/writer-assistant.agent@0.8.0",
    description: "Creative writing assistant with style customization.",
    downloads: 290,
  },
];

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export default function HomePage() {
  // Use mock data for now
  const resources = mockResources;

  const popularResources = resources.slice(0, 3);
  const recentResources = resources.slice(3, 6);

  return (
    <div className="p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-foreground-muted">Welcome back, Sean</p>
          <h1 className="text-2xl font-semibold text-foreground">Resource Registry</h1>
        </div>
        <Button icon={<PlusIcon />}>Publish</Button>
      </div>

      {/* Search Row */}
      <div className="flex items-center gap-3 mt-8 mb-10">
        <div className="flex-1">
          <SearchBox placeholder="Search resources..." className="w-full max-w-md" />
        </div>
        <Button variant="secondary" icon={<FilterIcon />}>
          Filters
        </Button>
      </div>

      {/* Popular Resources */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Popular Resources</h2>
          <Link href="/browse" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularResources.map((resource) => {
            const parsed = parseLocator(resource.locator);
            return (
              <Link
                key={resource.locator}
                href={`/resource/${encodeURIComponent(resource.locator)}`}
              >
                <ResourceCard
                  name={parsed.name}
                  type={parsed.type as "prompt" | "tool" | "agent"}
                  author={parsed.domain}
                  version={parsed.version}
                  description={resource.description}
                  downloads={resource.downloads}
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recently Added */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">Recently Added</h2>
          <Link href="/browse?sort=recent" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentResources.map((resource) => {
            const parsed = parseLocator(resource.locator);
            return (
              <Link
                key={resource.locator}
                href={`/resource/${encodeURIComponent(resource.locator)}`}
              >
                <ResourceCard
                  name={parsed.name}
                  type={parsed.type as "prompt" | "tool" | "agent"}
                  author={parsed.domain}
                  version={parsed.version}
                  description={resource.description}
                  downloads={resource.downloads}
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
