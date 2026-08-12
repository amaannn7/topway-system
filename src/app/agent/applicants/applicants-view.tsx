"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, Users, UserRound, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, delaySeverity, type DerivedStatus, type DelaySeverity } from "@/lib/pipeline-status";
import { EXPERIENCE_TYPE_LABELS, PIPELINE_STEPS } from "@/lib/constants/applicant";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import { ApplicantCard } from "./applicant-card";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";

const DELAY_STYLES: Record<DelaySeverity, string> = {
  ok: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning-foreground",
  late: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
};

function fmtShortDate(d: Date | string | null) {
  if (!d) return "–";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(d));
}

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
        <div className="isolate max-h-[calc(100vh-16rem)] overflow-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full caption-bottom text-sm">
              <TableHeader>
                <TableRow className="sticky top-0 z-1 border-b-2 border-b-primary/15 bg-[color-mix(in_oklch,var(--primary)_6%,var(--card))] shadow-sm hover:bg-[color-mix(in_oklch,var(--primary)_6%,var(--card))] [&_th]:h-11 [&_th]:text-[0.7rem] [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
                  <TableHead className="w-[62px] pl-5"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Musaned</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead className="w-28">Progress</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead className="pr-5">Saudi Visa</TableHead>
                  <TableHead className="pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:nth-child(even)]:bg-muted/25">
                {filtered.map((a) => {
                  const { days, severity } = delaySeverity(a.musanedDate);
                  const completedSteps = new Set(
                    a.pipelineSteps.filter((s) => s.completed).map((s) => s.key)
                  );
                  return (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer border-b-border/60 [&>td]:py-3"
                      onClick={() => router.push(`/agent/applicants/${a.id}`)}
                    >
                      <TableCell className="pl-5">
                        {a.headshotUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- small table thumbnail, not worth next/image overhead
                          <img
                            src={a.headshotUrl}
                            alt=""
                            className="size-10 rounded-full object-cover ring-2 ring-background shadow-sm outline outline-border/60"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-background outline outline-border/60">
                            <UserRound className="size-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground">{a.name || "(Unnamed)"}</span>
                          <span className="text-xs text-muted-foreground">
                            {a.refNo ? `Ref ${a.refNo}` : "No reference"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.role}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.experienceType
                          ? EXPERIENCE_TYPE_LABELS[a.experienceType as keyof typeof EXPERIENCE_TYPE_LABELS]
                          : "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {days !== null ? `${days}d ago` : "–"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex min-w-11 justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                            DELAY_STYLES[severity]
                          )}
                        >
                          {days !== null ? `${days}d` : "–"}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger
                            className="flex w-full items-center gap-2"
                            onClick={() => router.push(`/agent/applicants/${a.id}`)}
                          >
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-success"
                                style={{ width: `${(completedSteps.size / PIPELINE_STEPS.length) * 100}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                              {completedSteps.size}/{PIPELINE_STEPS.length}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start" className="flex-col items-start gap-1 py-2">
                            {PIPELINE_STEPS.map((step) => {
                              const done = completedSteps.has(step.key);
                              return (
                                <span key={step.key} className="flex items-center gap-1.5">
                                  {done ? (
                                    <Check className="size-3 text-success" />
                                  ) : (
                                    <span className="size-3 shrink-0 rounded-full border border-background/40" />
                                  )}
                                  {step.label}
                                </span>
                              );
                            })}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {fmtShortDate(a.ticketDate)}
                      </TableCell>
                      <TableCell className="pr-5 text-muted-foreground text-xs whitespace-nowrap">
                        {fmtShortDate(a.saudiAgentVisaDate)}
                      </TableCell>
                      <TableCell className="pr-5">
                        <ApplicantStatusBadge status={a.status as DerivedStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
          </table>
        </div>
      )}
    </div>
  );
}
