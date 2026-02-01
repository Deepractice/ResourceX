import Link from "next/link";
import { Search } from "lucide-react";
import { Header } from "~/components/layout/header";
import { ListItem } from "~/components/resource/list-item";

// Mock data for popular resources
const popularResources = [
  {
    name: "assistant-prompt",
    description: "AI assistant prompt for conversational interactions",
    type: "prompt",
    version: "v1.2.0",
    locator: "deepractice.ai/assistant-prompt.prompt@1.2.0",
  },
  {
    name: "code-reviewer",
    description: "Automated code review tool with AI suggestions",
    type: "tool",
    version: "v0.5.1",
    locator: "deepractice.ai/code-reviewer.tool@0.5.1",
  },
  {
    name: "translator-agent",
    description: "Multi-language translation agent",
    type: "agent",
    version: "v1.1.0",
    locator: "deepractice.ai/translator-agent.agent@1.1.0",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showSignOut />

      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground text-center">
          Find & Share AI Resources
        </h1>
        <p className="text-lg text-muted-foreground text-center">
          Discover prompts, tools, and agents for your AI workflows
        </p>

        {/* Search Box */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 h-12 w-full max-w-xl">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search resources..."
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </section>

      {/* Popular Resources */}
      <section className="flex flex-col items-center gap-6 px-6 py-10">
        <div className="flex items-center justify-between w-full max-w-3xl">
          <h2 className="text-xl font-semibold text-foreground">Popular Resources</h2>
          <Link
            href="/browse"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-3xl">
          {popularResources.map((resource) => (
            <ListItem key={resource.locator} {...resource} />
          ))}
        </div>
      </section>
    </div>
  );
}
