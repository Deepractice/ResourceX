import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../utils";

export interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  /** Logo size variant */
  size?: "sm" | "md" | "lg";
  /** Show only the icon without text */
  iconOnly?: boolean;
  /** Custom text, defaults to "deepartist" */
  text?: string;
  /** Custom icon letter, defaults to "D" */
  iconLetter?: string;
}

const sizeStyles = {
  sm: {
    icon: "w-6 h-6 rounded-md text-xs",
    text: "text-sm",
    gap: "gap-2",
  },
  md: {
    icon: "w-8 h-8 rounded-lg text-base",
    text: "text-lg",
    gap: "gap-2.5",
  },
  lg: {
    icon: "w-10 h-10 rounded-lg text-xl",
    text: "text-xl",
    gap: "gap-3",
  },
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    { className, size = "md", iconOnly = false, text = "deepartist", iconLetter = "D", ...props },
    ref
  ) => {
    const styles = sizeStyles[size];

    return (
      <div ref={ref} className={cn("flex items-center", styles.gap, className)} {...props}>
        <div
          className={cn(
            "flex items-center justify-center bg-primary text-primary-foreground font-bold",
            styles.icon
          )}
        >
          {iconLetter}
        </div>
        {!iconOnly && (
          <span className={cn("font-semibold text-foreground", styles.text)}>{text}</span>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";
