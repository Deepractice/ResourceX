import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../utils";

export interface VersionItem {
  /** Version number (e.g., "1.2.0") */
  version: string;
  /** Relative time or date (e.g., "1 hour ago") */
  date: string;
  /** Optional tag like "latest" */
  tag?: string;
}

export interface VersionListProps extends HTMLAttributes<HTMLDivElement> {
  /** List of versions */
  versions: VersionItem[];
  /** Optional title above the list */
  title?: string;
  /** Callback when a version is clicked */
  onVersionClick?: (version: VersionItem, index: number) => void;
  /** Label for the latest tag, defaults to "latest" */
  latestLabel?: string;
}

export const VersionList = forwardRef<HTMLDivElement, VersionListProps>(
  ({ className, versions, title, onVersionClick, latestLabel = "latest", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4 p-6 bg-background border border-border rounded-xl",
          className
        )}
        {...props}
      >
        {title && (
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
        )}
        <div className="flex flex-col">
          {versions.map((item, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between py-3",
                  index < versions.length - 1 && "border-b border-border",
                  onVersionClick && "cursor-pointer hover:bg-background-secondary -mx-2 px-2 rounded"
                )}
                onClick={() => onVersionClick?.(item, index)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      isFirst ? "font-medium text-foreground" : "text-foreground-muted"
                    )}
                  >
                    v{item.version}
                  </span>
                  {item.tag && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-success rounded">
                      {item.tag === "latest" ? latestLabel : item.tag}
                    </span>
                  )}
                </div>
                <span className="text-xs text-foreground-muted">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

VersionList.displayName = "VersionList";
