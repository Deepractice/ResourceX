import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface SearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  shortcut?: string;
}

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  ({ className, icon, shortcut, placeholder = "Search...", ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center gap-3 h-11 px-4 bg-background border border-border rounded-md transition-colors duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0",
          className
        )}
      >
        <span className="text-foreground-muted">{icon || <SearchIcon />}</span>
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-muted focus:outline-none"
          {...props}
        />
        {shortcut && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-foreground-muted bg-background-secondary border border-border rounded">
            {shortcut}
          </kbd>
        )}
      </div>
    );
  }
);

SearchBox.displayName = "SearchBox";
