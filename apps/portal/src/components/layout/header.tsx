import Link from "next/link";
import { Logo } from "./logo";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface HeaderProps {
  showSearch?: boolean;
  showSignOut?: boolean;
}

export function Header({ showSearch = true, showSignOut = false }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-8">
        <Logo />
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Browse
          </Link>
          <Link
            href="/docs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Docs
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {showSearch && <Input type="search" placeholder="Search resources..." className="w-60" />}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <span className="text-sm font-medium text-foreground">S</span>
        </div>
        {showSignOut ? <Button variant="outline">Sign out</Button> : <Button>Sign in</Button>}
      </div>
    </header>
  );
}
