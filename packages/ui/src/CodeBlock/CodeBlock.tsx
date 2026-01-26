import { forwardRef, type HTMLAttributes, useState, useCallback } from "react";
import { cn } from "../utils";

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "onCopy"> {
  /** Code content to display */
  code: string;
  /** Optional title above the code block */
  title?: string;
  /** Show copy button, defaults to true */
  showCopy?: boolean;
  /** Callback when code is copied */
  onCopy?: (code: string) => void;
  /** Text shown on copy button, defaults to "Copy" */
  copyLabel?: string;
  /** Text shown after copying, defaults to "Copied!" */
  copiedLabel?: string;
}

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      className,
      code,
      title,
      showCopy = true,
      onCopy,
      copyLabel = "Copy",
      copiedLabel = "Copied!",
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        onCopy?.(code);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        onCopy?.(code);
        setTimeout(() => setCopied(false), 2000);
      }
    }, [code, onCopy]);

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
        {title && (
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
        )}
        <div className="flex items-center justify-between gap-3 p-4 bg-background-secondary rounded-lg">
          <code className="flex-1 text-[13px] font-mono text-foreground overflow-x-auto">
            {code}
          </code>
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex-shrink-0 text-foreground-muted hover:text-foreground transition-colors",
                copied && "text-success"
              )}
              title={copied ? copiedLabel : copyLabel}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          )}
        </div>
      </div>
    );
  }
);

CodeBlock.displayName = "CodeBlock";
