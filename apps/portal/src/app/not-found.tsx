import Link from "next/link";
import { Header } from "~/components/layout/header";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header showSearch={false} />

      <main className="flex flex-col items-center justify-center px-6 py-24">
        <span className="text-7xl font-bold text-muted-foreground mb-4">404</span>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </main>
    </div>
  );
}
