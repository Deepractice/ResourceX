import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Optional href for links */
  href?: string;
  /** Whether this is the current (last) item */
  current?: boolean;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator between items, defaults to "/" */
  separator?: ReactNode;
  /** Callback when an item is clicked */
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, separator = "/", onItemClick, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-[13px] text-foreground-muted">{separator}</span>}
            {item.current ? (
              <span className="text-[13px] text-foreground font-normal">{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => onItemClick?.(item, index)}
                className="text-[13px] text-foreground-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            )}
          </div>
        ))}
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";
