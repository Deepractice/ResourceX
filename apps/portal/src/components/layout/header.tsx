import Link from "next/link";
import { Logo } from "./logo";

export function Header() {
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
            href="https://github.com/Deepractice/ResourceX"
            target="_blank"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            GitHub
          </Link>
        </nav>
      </div>
    </header>
  );
}
