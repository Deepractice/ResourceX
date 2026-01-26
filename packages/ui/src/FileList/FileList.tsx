import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils";

export interface FileItem {
  /** File name */
  name: string;
  /** File size (formatted string like "2.4 KB") */
  size: string;
  /** Optional custom icon */
  icon?: ReactNode;
}

export interface FileListProps extends HTMLAttributes<HTMLDivElement> {
  /** List of files */
  files: FileItem[];
  /** Optional title above the list */
  title?: string;
  /** Callback when a file is clicked */
  onFileClick?: (file: FileItem, index: number) => void;
}

const FileIcon = () => (
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
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

export const FileList = forwardRef<HTMLDivElement, FileListProps>(
  ({ className, files, title, onFileClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4 p-6 bg-background border border-border rounded-xl",
          className
        )}
        {...props}
      >
        {title && <h4 className="text-base font-semibold text-foreground">{title}</h4>}
        <div className="flex flex-col">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between py-3",
                index < files.length - 1 && "border-b border-border",
                onFileClick && "cursor-pointer hover:bg-background-secondary -mx-2 px-2 rounded"
              )}
              onClick={() => onFileClick?.(file, index)}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-foreground-muted">{file.icon || <FileIcon />}</span>
                <span className="text-sm text-foreground">{file.name}</span>
              </div>
              <span className="text-xs text-foreground-muted">{file.size}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

FileList.displayName = "FileList";
