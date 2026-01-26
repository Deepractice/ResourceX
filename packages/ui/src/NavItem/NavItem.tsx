import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface NavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
}

export const NavItem = forwardRef<HTMLButtonElement, NavItemProps>(
  ({ className, icon, label, active = false, badge, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center gap-3 w-full h-11 px-4 text-sm font-medium rounded-md transition-colors duration-200",
          active
            ? "bg-primary-light text-primary"
            : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground",
          className
        )}
        {...props}
      >
        {icon && (
          <span
            className={cn("w-[18px] h-[18px]", active ? "text-primary" : "text-foreground-muted")}
          >
            {icon}
          </span>
        )}
        <span className="flex-1 text-left truncate">{label}</span>
        {badge !== undefined && (
          <span
            className={cn(
              "px-1.5 py-0.5 text-[11px] font-medium rounded",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-background-tertiary text-foreground-muted"
            )}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }
);

NavItem.displayName = "NavItem";
