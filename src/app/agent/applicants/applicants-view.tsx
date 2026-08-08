"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, Users, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, delaySeverity, type DerivedStatus, type DelaySeverity } from "@/lib/pipeline-status";
import { EXPERIENCE_TYPE_LABELS } from "@/lib/constants/applicant";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import { ApplicantCard } from "./applicant-card";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";

const DELAY_STYLES: Record<DelaySeverity, string> = {
  ok: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning-foreground",
  late: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
};

export function ApplicantsView({ applicants }: { applicants: AgentApplicantView[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<"cards" | "list">("cards");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const experience = searchParams.get("experience") ?? "";

  const filtered = useMemo(
    () =>
      applicants.filter((a) => {
        if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (status && a.status !== status) return false;
        if (experience && a.experienceType !== experience) return false;
        return true;
      }),
    [applicants, q, status, experience]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            defaultValue={q}
            className="pl-8"
            onChange={(e) => setParam("q", e.target.value)}
          />
        </div>
        <Select
          value={experience || "ALL"}
          onValueChange={(v) => setParam("experience", v === "ALL" || !v ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All experience</SelectItem>
            {Object.entries(EXPERIENCE_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status || "ALL"}
          onValueChange={(v) => setParam("status", v === "ALL" || !v ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <div className="flex gap-0.5 rounded-md border p-0.5">
          <button
            onClick={() => setView("cards")}
            aria-label="Card view"
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "cards" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              view === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <Users className="size-8 opacity-40" />
          <p>
            {applicants.length === 0
              ? "No applicants assigned yet."
              : "No applicants match the current filters."}
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => (
            <ApplicantCard key={a.id} applicant={a} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
                <th className="w-10 py-2 pl-3 text-left"></th>
                <th className="py-2 pr-3 text-left">Name</th>
                <th className="py-2 pr-3 text-left">Role</th>
                <th className="py-2 pr-3 text-left">Age</th>
                <th className="py-2 pr-3 text-left">Experience</th>
                <th className="py-2 pr-3 text-left">Musaned</th>
                <th className="py-2 pr-3 text-left">Delay</th>
                <th className="py-2 pr-3 text-left">Notes</th>
                <th className="py-2 pr-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const { days, severity } = delaySeverity(a.musanedDate);
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-accent/40">
                    <td className="py-2 pl-3">
                      <Link href={`/agent/applicants/${a.id}`}>
                        {a.headshotUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- small table thumbnail, not worth next/image overhead
                          <img
                            src={a.headshotUrl}
                            alt=""
                            className="h-8 w-6 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-6 items-center justify-center rounded bg-muted text-muted-foreground">
                            <UserRound className="size-3" />
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">
                      <Link href={`/agent/applicants/${a.id}`} className="font-medium hover:underline">
                        {a.name || "(Unnamed)"}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.role}</td>
                    <td className="py-2 pr-3 text-muted-foreground tabular-nums">{a.age ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {a.experienceType
                        ? EXPERIENCE_TYPE_LABELS[a.experienceType as keyof typeof EXPERIENCE_TYPE_LABELS]
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground text-xs whitespace-nowrap">
                      {days !== null ? `${days}d ago` : "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                          DELAY_STYLES[severity]
                        )}
                      >
                        {days !== null ? `${days}d` : "—"}
                      </span>
                    </td>
                    <td className="max-w-40 truncate py-2 pr-3 text-xs text-muted-foreground">
                      {a.notes || ""}
                    </td>
                    <td className="py-2 pr-3">
                      <ApplicantStatusBadge status={a.status as DerivedStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
