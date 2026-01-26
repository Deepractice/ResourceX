import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export type ResourceType = "prompt" | "tool" | "agent" | "config" | "text" | "json";

export interface ResourceCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  type: ResourceType;
  author: string;
  version: string;
  description?: string;
  downloads?: number;
  icon?: ReactNode;
}

const typeColors: Record<ResourceType, { bg: string; text: string }> = {
  prompt: { bg: "bg-primary-light", text: "text-primary" },
  tool: { bg: "bg-info-light", text: "text-info" },
  agent: { bg: "bg-purple-50", text: "text-purple-600" },
  config: { bg: "bg-warning-light", text: "text-warning-foreground" },
  text: { bg: "bg-background-tertiary", text: "text-foreground-secondary" },
  json: { bg: "bg-warning-light", text: "text-warning-foreground" },
};

// SVG Icons
const MessageIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

const WrenchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
  </svg>
);

const BotIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const FileTextIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
  </svg>
);

const FileJsonIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
  </svg>
);

const defaultIcons: Record<ResourceType, () => JSX.Element> = {
  prompt: MessageIcon,
  tool: WrenchIcon,
  agent: BotIcon,
  config: SettingsIcon,
  text: FileTextIcon,
  json: FileJsonIcon,
};

export const ResourceCard = forwardRef<HTMLDivElement, ResourceCardProps>(
  (
    { className, name, type, author, version, description, downloads = 0, icon, onClick, ...props },
    ref
  ) => {
    const colors = typeColors[type] || typeColors.text;
    const DefaultIcon = defaultIcons[type] || FileTextIcon;

    const formatDownloads = (num: number) => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
      }
      return num.toString();
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 p-5 bg-background border border-border rounded-lg transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-md hover:border-border-strong",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-md",
              colors.bg,
              colors.text
            )}
          >
            {icon || <DefaultIcon />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground truncate">{name}</h3>
            <p className="text-xs text-foreground-muted truncate">
              {author} • v{version}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-[13px] text-foreground-secondary leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3">
          <span
            className={cn("px-2 py-0.5 text-[11px] font-medium rounded", colors.bg, colors.text)}
          >
            {type}
          </span>
          {downloads > 0 && (
            <span className="text-xs text-foreground-muted">
              {formatDownloads(downloads)} downloads
            </span>
          )}
        </div>
      </div>
    );
  }
);

ResourceCard.displayName = "ResourceCard";
