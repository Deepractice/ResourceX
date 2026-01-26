"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Breadcrumb, CodeBlock, FileList, VersionList } from "@resourcexjs/ui";
import { parseLocator } from "~/lib/api";

// Mock data
const mockFiles = [
  { name: "content", size: "2.4 KB" },
  { name: "schema.json", size: "1.2 KB" },
  { name: "manifest.json", size: "0.5 KB" },
];

const mockVersions = [
  { version: "1.2.0", date: "3 days ago", tag: "latest" },
  { version: "1.1.0", date: "2 weeks ago" },
  { version: "1.0.0", date: "1 month ago" },
];

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export default function ResourceDetailPage() {
  const params = useParams();
  const locator = params.locator as string;
  const decodedLocator = decodeURIComponent(locator);
  const parsed = parseLocator(decodedLocator);
  const installCommand = `rxr add ${decodedLocator}`;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Browse", href: "/browse" },
    {
      label: parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1) + "s",
      href: `/browse?type=${parsed.type}`,
    },
    { label: parsed.name, current: true },
  ];

  return (
    <div className="p-10">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-start justify-between mt-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{parsed.name}</h1>
            <p className="text-sm text-foreground-muted">
              {parsed.domain}
              {parsed.path && `/${parsed.path}`} •{" "}
              <span className="text-primary">v{parsed.version}</span> •{" "}
              <span className="px-2 py-0.5 bg-primary-light text-primary text-xs rounded">
                {parsed.type}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<CopyIcon />}>
            Copy
          </Button>
          <Button icon={<DownloadIcon />}>Install</Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Description */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
            <p className="text-foreground-secondary leading-relaxed">
              AI assistant prompt for conversational interactions with context awareness. Supports
              multi-turn dialogue, maintains context across sessions, and adapts to user preferences
              for natural dialogue.
            </p>
          </section>

          {/* Installation */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Installation</h2>
            <CodeBlock code={installCommand} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="w-[280px] space-y-6">
          {/* Files */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Files</h3>
            <FileList files={mockFiles} />
          </section>

          {/* Versions */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Versions</h3>
            <VersionList versions={mockVersions} />
          </section>
        </div>
      </div>
    </div>
  );
}
