import Link from "next/link";

interface ListItemProps {
  name: string;
  description: string;
  type: string;
  version: string;
  locator: string;
}

export function ListItem({
  name,
  description,
  type,
  version,
  locator,
}: ListItemProps) {
  return (
    <Link
      href={`/resource/${encodeURIComponent(locator)}`}
      className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-medium text-foreground">{name}</span>
        <span className="text-[13px] text-muted-foreground">{description}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {type}
        </span>
        <span className="text-[13px] text-muted-foreground">{version}</span>
      </div>
    </Link>
  );
}
