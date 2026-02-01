import { Search } from "lucide-react";
import { Header } from "~/components/layout/header";
import { API_PREFIX } from "@resourcexjs/server";

const PAGE_SIZE = 20;

interface Resource {
  locator: string;
  name: string;
  type: string;
  tag: string;
  registry?: string;
}

interface SearchResponse {
  results: Resource[];
  total: number;
}

async function fetchResources(
  query?: string,
  page: number = 1
): Promise<SearchResponse> {
  const offset = (page - 1) * PAGE_SIZE;
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(offset));

  const baseUrl = process.env.REGISTRY_URL || "http://localhost:5200";
  const res = await fetch(`${baseUrl}${API_PREFIX}/search?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { results: [], total: 0 };
  }

  return res.json();
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1", 10);

  const { results, total } = await fetchResources(query, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <form action="/" method="GET" className="mb-8">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 h-12">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search resources..."
              className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {total} resource{total !== 1 ? "s" : ""} found
          {query && ` for "${query}"`}
        </div>

        {/* Resource List */}
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No resources found
            </div>
          ) : (
            results.map((resource) => (
              <a
                key={resource.locator}
                href={`/resource/${encodeURIComponent(resource.locator)}`}
                className="block p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">
                      {resource.name}
                    </span>
                    {resource.type && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                        {resource.type}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {resource.tag}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground font-mono">
                  {resource.locator}
                </div>
              </a>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <a
                href={`/?q=${encodeURIComponent(query)}&page=${page - 1}`}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted"
              >
                Previous
              </a>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`/?q=${encodeURIComponent(query)}&page=${page + 1}`}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted"
              >
                Next
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
