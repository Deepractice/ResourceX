"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface InstallTabsProps {
  locator: string;
}

type InstallMethod = "dpx" | "curl" | "api";

export function InstallTabs({ locator }: InstallTabsProps) {
  const [activeTab, setActiveTab] = useState<InstallMethod>("dpx");
  const [copied, setCopied] = useState(false);

  const commands: Record<InstallMethod, string> = {
    dpx: `dpx install ${locator}`,
    curl: `curl -O https://registry.resourcex.dev/api/content/${encodeURIComponent(locator)}`,
    api: `GET /api/resource/${encodeURIComponent(locator)}`,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <div className="flex">
        {(["dpx", "curl", "api"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "rounded-t-md bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex h-12 items-center justify-between rounded-b-md rounded-tr-md bg-muted px-4">
        <code className="text-sm text-foreground">{commands[activeTab]}</code>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
