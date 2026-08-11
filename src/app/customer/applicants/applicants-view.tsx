"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABEL } from "@/lib/pipeline-status";
import { CustomerApplicantCard } from "./applicant-card";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";

export function ApplicantsView({ applicants }: { applicants: AgentApplicantView[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

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

  const filtered = useMemo(
    () =>
      applicants.filter((a) => {
        if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (status && a.status !== status) return false;
        return true;
      }),
    [applicants, q, status]
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
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <Users className="size-8 opacity-40" />
          <p>
            {applicants.length === 0
              ? "No profiles have been shared with you yet."
              : "No profiles match the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => (
            <CustomerApplicantCard key={a.id} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}
