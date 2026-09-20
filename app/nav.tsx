"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText, ChartSpline, CalendarDays, LogOut } from "lucide-react";
import { signOut } from "./login/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: ScrollText },
  { href: "/analytics", label: "Analytics", icon: ChartSpline },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function Nav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors ${
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {link.label}
              </Link>
            );
          })}
        </div>
        <form action={signOut}>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
