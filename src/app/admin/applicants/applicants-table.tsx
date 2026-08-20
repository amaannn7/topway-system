"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound, Pencil, Trash2, Check, Play } from "lucide-react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApplicantStatusBadge } from "./applicant-status-badge";
import { LifecycleStatusBadge } from "./lifecycle-status-badge";
import { ProfileViewDialog, type ProfileViewData } from "./profile-view-dialog";
import { deleteApplicant, resumeApplicant } from "./actions";
import {
  DISPUTE_CATEGORY_LABEL,
  type DelaySeverity,
  type DisputeCategory,
  type LifecycleStatus,
} from "@/lib/pipeline-status";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";

const DELAY_STYLES: Record<DelaySeverity, string> = {
  ok: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning-foreground",
  late: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
};

const DISPUTE_CATEGORY_STYLES: Record<DisputeCategory, string> = {
  RUNAWAY: "bg-destructive/10 text-destructive",
  REFUSAL_TO_WORK: "bg-warning/15 text-warning-foreground",
  MEDICALLY_UNFIT: "bg-info/10 text-info",
  OTHER: "bg-muted text-muted-foreground",
};

export type ApplicantRow = ProfileViewData & {
  refNo: string | null;
  nationality: string | null;
  age: number | null;
  experienceType: string | null;
  doneSteps: number;
  delayDays: number | null;
  delaySeverity: DelaySeverity;
  ticketDate: Date | null;
  saudiAgentVisaDate: Date | null;
  lifecycleStatus: LifecycleStatus;
  latestDisputeCategory: DisputeCategory | null;
};

const STEP_COLUMNS = PIPELINE_STEPS;

function fmtShortDate(d: Date | null) {
  if (!d) return "–";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(d);
}

function DeleteRowButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently removes {name || "this applicant"}&apos;s profile. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await deleteApplicant(id);
                toast.success("Profile deleted");
                router.refresh();
              } catch {
                toast.error("Could not delete profile");
                setPending(false);
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ResumeRowButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Resume"
      title={`Resume ${name || "this applicant"}`}
      disabled={pending}
      onClick={async (e) => {
        e.stopPropagation();
        setPending(true);
        try {
          await resumeApplicant(id);
          toast.success("Application resumed");
          router.refresh();
        } catch {
          toast.error("Could not resume application");
          setPending(false);
        }
      }}
    >
      <Play className="size-3.5" />
    </Button>
  );
}

export function ApplicantsTable({ rows }: { rows: ApplicantRow[] }) {
  const [viewing, setViewing] = useState<ApplicantRow | null>(null);

  return (
    <>
      <div className="isolate max-h-[calc(100vh-14rem)] overflow-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow className="sticky top-0 z-1 border-b-2 border-b-primary/15 bg-[color-mix(in_oklch,var(--primary)_6%,var(--card))] shadow-sm hover:bg-[color-mix(in_oklch,var(--primary)_6%,var(--card))] [&_th]:h-10 [&_th]:text-[0.7rem] [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
              <TableHead className="w-[54px] pl-4"></TableHead>
              <TableHead className="min-w-36">Name</TableHead>
              <TableHead className="w-24">Role</TableHead>
              <TableHead className="w-28">Experience</TableHead>
              <TableHead className="w-20">Musaned</TableHead>
              <TableHead className="w-16">Delay</TableHead>
              <TableHead className="w-28">Progress</TableHead>
              <TableHead className="w-16">Ticket</TableHead>
              <TableHead className="w-20">Visa</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32">Contract</TableHead>
              <TableHead className="w-28">Dispute</TableHead>
              <TableHead className="w-16 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:nth-child(even)]:bg-muted/25">
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={13} className="py-16 text-center text-sm text-muted-foreground">
                  No applicants match the current filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((a) => (
              <TableRow
                key={a.id}
                className="group cursor-pointer border-b-border/60 transition-colors hover:bg-primary/5 [&>td]:py-3"
                onClick={() => setViewing(a)}
              >
                <TableCell className="pl-4">
                  {a.headshotUrl ? (
                    <Image
                      src={a.headshotUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 rounded-full object-cover ring-2 ring-background shadow-sm outline outline-border/60"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-background outline outline-border/60">
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
                <TableCell className="text-muted-foreground">{a.experienceType || "–"}</TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {a.delayDays !== null ? `${a.delayDays}d ago` : "–"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex min-w-11 justify-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                      DELAY_STYLES[a.delaySeverity]
                    )}
                  >
                    {a.delayDays !== null ? `${a.delayDays}d` : "–"}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger
                      className="flex w-full items-center gap-2"
                      onClick={() => setViewing(a)}
                    >
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${(a.doneSteps / STEP_COLUMNS.length) * 100}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                        {a.doneSteps}/{STEP_COLUMNS.length}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="flex-col items-start gap-1 py-2">
                      {STEP_COLUMNS.map((step) => {
                        const done = a.completedSteps.has(step.key);
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
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                  {fmtShortDate(a.ticketDate)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                  {fmtShortDate(a.saudiAgentVisaDate)}
                </TableCell>
                <TableCell>
                  <ApplicantStatusBadge status={a.status} />
                </TableCell>
                <TableCell>
                  {a.lifecycleStatus === "NOT_DEPARTED" ? (
                    <span className="text-muted-foreground">–</span>
                  ) : (
                    <LifecycleStatusBadge status={a.lifecycleStatus} />
                  )}
                </TableCell>
                <TableCell>
                  {a.latestDisputeCategory ? (
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        DISPUTE_CATEGORY_STYLES[a.latestDisputeCategory]
                      )}
                    >
                      {DISPUTE_CATEGORY_LABEL[a.latestDisputeCategory]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    {a.status === "ON_HOLD" && <ResumeRowButton id={a.id} name={a.name} />}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit / status"
                      render={<Link href={`/admin/applicants/${a.id}/pipeline`} />}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteRowButton id={a.id} name={a.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>

      <ProfileViewDialog
        data={viewing}
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </>
  );
}
