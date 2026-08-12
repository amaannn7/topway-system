"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "edit", label: "Edit" },
  { segment: "pipeline", label: "Pipeline" },
  { segment: "documents", label: "Documents" },
  { segment: "history", label: "History" },
] as const;

export function ApplicantTabsNav({ applicantId }: { applicantId: string }) {
  const pathname = usePathname();
  const base = `/admin/applicants/${applicantId}`;

  return (
    <nav className="flex gap-1 rounded-xl bg-muted/50 p-1">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.segment}
            href={href}
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
