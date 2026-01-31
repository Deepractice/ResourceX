import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "~/components/layout/header";
import { InstallTabs } from "~/components/resource/install-tabs";
import { MetadataSidebar } from "~/components/resource/sidebar";

interface ResourcePageProps {
  params: Promise<{ locator: string }>;
}

async function getResource(locator: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/resource/${encodeURIComponent(locator)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch {
    return null;
  }
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { locator } = await params;
  const decodedLocator = decodeURIComponent(locator);
  const resource = await getResource(decodedLocator);

  if (!resource) {
    notFound();
  }

  const { domain, path, name, type, version } = resource;
  const fullName = type ? `${name}.${type}` : name;
  const displayLocator = path
    ? `${domain}/${path}/${fullName}@${version}`
    : `${domain}/${fullName}@${version}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Browse
          </Link>
          <span>/</span>
          <span className="capitalize">{type || "Resources"}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{name}</span>
        </nav>

        {/* Resource Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
            <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-foreground">
              {type}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {version} • Published by {domain}
          </p>
        </div>

        {/* Install Section */}
        <div className="mb-8">
          <InstallTabs locator={displayLocator} />
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-4">README</h2>
            <hr className="border-border mb-4" />
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                This is a {type} resource published by {domain}.
              </p>
              <h3 className="text-foreground mt-6 mb-2">Usage</h3>
              <p className="text-muted-foreground">
                Install this resource using the command above, then use it in your AI workflows.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <MetadataSidebar
            installCommand={`dpx install ${displayLocator}`}
            version={version}
            publishedBy={domain}
            license="MIT"
          />
        </div>
      </main>
    </div>
  );
}
