"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { STATUS_LABEL } from "@/lib/pipeline-status";
import { WORKER_CATEGORY_LABELS } from "@/lib/constants/applicant";

const CATEGORY_PILLS = [
  { value: "", label: "All workers" },
  { value: "AVAILABLE_EXPERIENCED", label: WORKER_CATEGORY_LABELS.AVAILABLE_EXPERIENCED },
  { value: "AVAILABLE_INEXPERIENCED", label: WORKER_CATEGORY_LABELS.AVAILABLE_INEXPERIENCED },
  { value: "CONTRACTED", label: WORKER_CATEGORY_LABELS.CONTRACTED },
] as const;

export function ApplicantsToolbar() {
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

  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setParam("category", pill.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === pill.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            defaultValue={searchParams.get("q") ?? ""}
            className="pl-8"
            onChange={(e) => setParam("q", e.target.value)}
          />
        </div>

        <Select
          value={searchParams.get("status") ?? "ALL"}
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

        <Button render={<Link href="/admin/applicants/new" />}>
          <Plus className="size-4" />
          New profile
        </Button>
      </div>
    </div>
  );
}
