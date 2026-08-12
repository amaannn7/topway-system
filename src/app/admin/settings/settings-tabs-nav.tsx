"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/settings/branding", label: "Branding" },
  { href: "/admin/settings/agent-access", label: "Agent access" },
  { href: "/admin/settings/team", label: "Team" },
  { href: "/admin/settings/audit-log", label: "Audit log" },
] as const;

export function SettingsTabsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-xl bg-muted/50 p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
