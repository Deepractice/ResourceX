"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo, NavItem } from "@resourcexjs/ui";

const navItems = [
  { href: "/", label: "Overview", icon: "layout-grid" },
  { href: "/browse", label: "Browse", icon: "compass" },
  { href: "/prompts", label: "Prompts", icon: "message-square" },
  { href: "/tools", label: "Tools", icon: "wrench" },
  { href: "/agents", label: "Agents", icon: "bot" },
];

// Simple icon component
function Icon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    "layout-grid": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    compass: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
    "message-square": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    wrench: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
      </svg>
    ),
    bot: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
      </svg>
    ),
  };

  return <span className="w-[18px] h-[18px]">{icons[name]}</span>;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-full bg-background border-r border-border flex flex-col">
      <div className="p-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <NavItem
                icon={<Icon name={item.icon} />}
                label={item.label}
                active={pathname === item.href}
              />
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
