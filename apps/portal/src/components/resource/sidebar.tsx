interface SidebarProps {
  installCommand: string;
  version: string;
  publishedBy: string;
  downloads?: number;
  license?: string;
}

function SidebarSection({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function MetadataSidebar({
  installCommand,
  version,
  publishedBy,
  downloads,
  license,
}: SidebarProps) {
  return (
    <aside className="flex w-72 flex-col gap-6">
      <SidebarSection label="Install" value={<code>{installCommand}</code>} />
      <SidebarSection label="Version" value={version} />
      <SidebarSection label="Published by" value={publishedBy} />
      {downloads !== undefined && (
        <SidebarSection
          label="Downloads"
          value={downloads.toLocaleString()}
        />
      )}
      {license && <SidebarSection label="License" value={license} />}
    </aside>
  );
}
