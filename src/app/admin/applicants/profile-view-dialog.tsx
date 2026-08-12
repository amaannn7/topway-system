"use client";

import Image from "next/image";
import Link from "next/link";
import { UserRound, Pencil, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApplicantStatusBadge } from "./applicant-status-badge";
import { PIPELINE_STEPS } from "@/lib/constants/applicant";
import type { DerivedStatus } from "@/lib/pipeline-status";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
      <span className="truncate text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export type ProfileViewData = {
  id: string;
  name: string;
  role: string;
  status: DerivedStatus;
  headshotUrl: string | null;
  nationality: string | null;
  religion: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  maritalStatus: string | null;
  passportNo: string | null;
  passportIssuedAt: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  emergencyContact: string | null;
  address: string | null;
  notes: string | null;
  completedSteps: Set<string>;
};

export function ProfileViewDialog({
  data,
  open,
  onOpenChange,
}: {
  data: ProfileViewData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!data) return null;

  const contactFields = [
    ["Phone", data.phone],
    ["WhatsApp", data.whatsapp],
    ["Email", data.email],
    ["Emergency", data.emergencyContact],
    ["Address", data.address],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl gap-3">
        <DialogHeader>
          <DialogTitle>{data.name || "(Unnamed)"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          {data.headshotUrl ? (
            <Image
              src={data.headshotUrl}
              alt=""
              width={72}
              height={88}
              className="h-22 w-18 shrink-0 rounded-lg object-cover ring-2 ring-background shadow-sm outline outline-border/60"
            />
          ) : (
            <div className="flex h-22 w-18 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-2 ring-background outline outline-border/60">
              <UserRound className="size-6" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{data.role}</p>
              <ApplicantStatusBadge status={data.status} />
            </div>
            <div className="flex flex-wrap gap-1">
              {PIPELINE_STEPS.map((s) => {
                const done = data.completedSteps.has(s.key);
                return (
                  <span
                    key={s.key}
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                      done
                        ? "border-success/25 bg-success/10 text-success"
                        : "border-border bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`inline-flex size-2.5 items-center justify-center rounded-full ${
                        done ? "bg-success text-success-foreground" : "bg-muted-foreground/25"
                      }`}
                    >
                      {done && <Check className="size-1.5" strokeWidth={3.5} />}
                    </span>
                    {s.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-3">
          <div className="rounded-lg bg-muted/30 p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Personal &amp; passport
            </p>
            <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-x-3 gap-y-2">
              <Row label="Nationality" value={data.nationality} />
              <Row label="Religion" value={data.religion} />
              <Row label="Age" value={data.age} />
              <Row label="Marital" value={data.maritalStatus} />
              <Row label="Height" value={data.heightCm ? `${data.heightCm} cm` : null} />
              <Row label="Weight" value={data.weightKg ? `${data.weightKg} kg` : null} />
              <Row label="Passport No." value={data.passportNo} />
              <Row label="Issued at" value={data.passportIssuedAt} />
            </div>
          </div>
          {contactFields.length > 0 && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-warning-foreground uppercase">
                Contact (internal only)
              </p>
              <div className="grid grid-cols-[repeat(4,minmax(0,1fr))] gap-x-3 gap-y-2">
                {contactFields.map(([label, value]) => (
                  <Row key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          )}
          {data.notes && (
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Notes
              </p>
              <p className="line-clamp-3 text-sm text-foreground">{data.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-1">
          <Button
            variant="outline"
            render={<Link href={`/admin/applicants/${data.id}`} />}
          >
            Full profile
          </Button>
          <Button render={<Link href={`/admin/applicants/${data.id}/pipeline`} />}>
            <Pencil className="size-4" />
            Update status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
