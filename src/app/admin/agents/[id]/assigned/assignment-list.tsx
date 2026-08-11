"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { setAgentAssignments } from "../../actions";

type ApplicantRow = {
  id: string;
  name: string;
  role: string;
  headshotUrl: string | null;
  isPending: boolean;
};

export function AssignmentList({
  agentId,
  applicants,
  initiallyAssignedIds,
}: {
  agentId: string;
  applicants: ApplicantRow[];
  initiallyAssignedIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set(initiallyAssignedIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      try {
        await setAgentAssignments(agentId, [...selected]);
        toast.success("Assignment saved");
        router.refresh();
      } catch {
        toast.error("Could not save assignment");
      }
    });
  }

  if (applicants.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No applicant profiles yet. Create profiles first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto pr-1">
        {applicants.map((a) => {
          const checked = selected.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                checked
                  ? "border-purple bg-purple/5"
                  : a.isPending
                    ? "border-warning/40 hover:border-warning/60"
                    : "border-border hover:border-purple/40"
              )}
            >
              {a.headshotUrl ? (
                <Image
                  src={a.headshotUrl}
                  alt=""
                  width={32}
                  height={40}
                  className="h-10 w-8 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  <UserRound className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.name || "(Unnamed)"}</p>
                <p className="truncate text-xs text-muted-foreground">{a.role}</p>
              </div>
              {a.isPending && !checked && (
                <Badge
                  variant="outline"
                  className="border-warning/40 bg-warning/10 text-xs text-warning-foreground"
                >
                  Requested
                </Badge>
              )}
              <Checkbox checked={checked} className="pointer-events-none" />
            </button>
          );
        })}
      </div>
      <Button onClick={save} disabled={pending} className="self-end">
        {pending ? "Saving…" : "Save assignment"}
      </Button>
    </div>
  );
}
