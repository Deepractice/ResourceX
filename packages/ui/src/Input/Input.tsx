import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, iconPosition = "left", error, ...props }, ref) => {
    const baseStyles =
      "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors duration-200 placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

    const stateStyles = error
      ? "border-error focus:ring-error"
      : "border-border focus:border-primary focus:ring-primary";

    if (icon) {
      return (
        <div className="relative">
          {iconPosition === "left" && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              baseStyles,
              stateStyles,
              iconPosition === "left" && "pl-10",
              iconPosition === "right" && "pr-10",
              className
            )}
            {...props}
          />
          {iconPosition === "right" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {icon}
            </span>
          )}
        </div>
      );
    }

    return <input ref={ref} className={cn(baseStyles, stateStyles, className)} {...props} />;
  }
);

Input.displayName = "Input";
