"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound, Pencil, Trash2, Check } from "lucide-react";
import {
  Table,
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
import { ApplicantStatusBadge } from "./applicant-status-badge";
import { ProfileViewDialog, type ProfileViewData } from "./profile-view-dialog";
import { deleteApplicant } from "./actions";
import type { DelaySeverity } from "@/lib/pipeline-status";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";

const DELAY_STYLES: Record<DelaySeverity, string> = {
  ok: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning-foreground",
  late: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
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

export function ApplicantsTable({ rows }: { rows: ApplicantRow[] }) {
  const [viewing, setViewing] = useState<ApplicantRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-b-info/15 bg-info/5 hover:bg-info/5 [&_th]:h-11 [&_th]:text-[0.7rem] [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
                <TableHead className="w-[62px] pl-5"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Musaned</TableHead>
                <TableHead>Delay</TableHead>
                {STEP_COLUMNS.map((step) => (
                  <TableHead key={step.key} className="w-11 text-center" title={step.label}>
                    {step.label.slice(0, 3)}
                  </TableHead>
                ))}
                <TableHead>Ticket</TableHead>
                <TableHead>Saudi Visa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:nth-child(even)]:bg-muted/25">
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={15} className="py-16 text-center text-sm text-muted-foreground">
                    No applicants match the current filters.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((a) => (
                <TableRow
                  key={a.id}
                  className="group cursor-pointer border-b-border/60 [&>td]:py-3"
                  onClick={() => setViewing(a)}
                >
                  <TableCell className="pl-5">
                    {a.headshotUrl ? (
                      <Image
                        src={a.headshotUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover ring-2 ring-background shadow-sm outline outline-border/60"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-info/10 text-info ring-2 ring-background outline outline-border/60">
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
                  {STEP_COLUMNS.map((step) => {
                    const done = a.completedSteps.has(step.key);
                    return (
                      <TableCell key={step.key} className="text-center" title={step.label}>
                        {done ? (
                          <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-success/15 text-success">
                            <Check className="size-3" />
                          </span>
                        ) : (
                          <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-muted/70 text-muted-foreground/40">
                            <span className="size-1 rounded-full bg-current" />
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {fmtShortDate(a.ticketDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {fmtShortDate(a.saudiAgentVisaDate)}
                  </TableCell>
                  <TableCell>
                    <ApplicantStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
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
          </Table>
        </div>
      </div>

      <ProfileViewDialog
        data={viewing}
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </>
  );
}
