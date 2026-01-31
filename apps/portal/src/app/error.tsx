"use client";

import Link from "next/link";
import { Header } from "~/components/layout/header";
import { Button } from "~/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error }: ErrorProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header showSearch={false} />

      <main className="flex flex-col items-center justify-center px-6 py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-6">
          <span className="text-3xl font-bold text-red-500">!</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-2">
          {error.message || "An unexpected error occurred"}
        </p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Please try again or contact support if the problem persists.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </main>
    </div>
  );
}
