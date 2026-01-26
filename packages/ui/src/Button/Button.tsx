import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary",
      secondary:
        "bg-secondary text-secondary-foreground border border-border hover:bg-secondary-hover focus:ring-border",
      ghost: "text-foreground hover:bg-background-tertiary focus:ring-border",
      destructive: "bg-error text-white hover:bg-error-foreground focus:ring-error",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
    };

    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {icon && iconPosition === "left" && <span className={iconSizes[size]}>{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className={iconSizes[size]}>{icon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
