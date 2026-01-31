import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
        <span className="text-sm font-bold text-background">R</span>
      </div>
      <span className="text-base font-semibold text-foreground">Registry</span>
    </Link>
  );
}
