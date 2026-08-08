"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound, Pencil, Trash2 } from "lucide-react";
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
};

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
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Musaned</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-12 text-center text-sm text-muted-foreground">
                  No applicants match the current filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((a) => (
              <TableRow
                key={a.id}
                className="cursor-pointer"
                onClick={() => setViewing(a)}
              >
                <TableCell>
                  {a.headshotUrl ? (
                    <Image
                      src={a.headshotUrl}
                      alt=""
                      width={32}
                      height={40}
                      className="h-10 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                      <UserRound className="size-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{a.name || "(Unnamed)"}</span>
                  {a.refNo && (
                    <span className="ml-2 text-xs text-muted-foreground">Ref {a.refNo}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{a.role}</TableCell>
                <TableCell className="text-muted-foreground">{a.nationality || "—"}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{a.age ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{a.experienceType || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {a.delayDays !== null ? `${a.delayDays}d ago` : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                      DELAY_STYLES[a.delaySeverity]
                    )}
                  >
                    {a.delayDays !== null ? `${a.delayDays}d` : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{a.doneSteps}/6</TableCell>
                <TableCell>
                  <ApplicantStatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
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

      <ProfileViewDialog
        data={viewing}
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </>
  );
}
