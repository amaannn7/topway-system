"use client";

import Image from "next/image";
import Link from "next/link";
import { UserRound, Pencil } from "lucide-react";
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
    <div className="flex gap-2 py-0.5 text-sm">
      <span className="min-w-28 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span>{value}</span>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data.name || "(Unnamed)"}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4">
          {data.headshotUrl ? (
            <Image
              src={data.headshotUrl}
              alt=""
              width={80}
              height={100}
              className="h-[100px] w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-[100px] w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UserRound className="size-6" />
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{data.role}</p>
            <div className="mt-1">
              <ApplicantStatusBadge status={data.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {PIPELINE_STEPS.map((s) => (
                <span
                  key={s.key}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    data.completedSteps.has(s.key)
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {data.completedSteps.has(s.key) ? "✓" : "○"} {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-3">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Personal
            </p>
            <div className="grid grid-cols-2 gap-x-2">
              <Row label="Nationality" value={data.nationality} />
              <Row label="Religion" value={data.religion} />
              <Row label="Age" value={data.age} />
              <Row label="Height" value={data.heightCm ? `${data.heightCm} cm` : null} />
              <Row label="Weight" value={data.weightKg ? `${data.weightKg} kg` : null} />
              <Row label="Marital" value={data.maritalStatus} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Passport
            </p>
            <Row label="No." value={data.passportNo} />
            <Row label="Issued at" value={data.passportIssuedAt} />
          </div>
          {(data.phone || data.whatsapp || data.email || data.emergencyContact || data.address) && (
            <div className="rounded-md bg-warning/5 p-2.5">
              <p className="mb-1 text-xs font-semibold tracking-wide text-warning-foreground uppercase">
                Contact (internal only)
              </p>
              <Row label="Phone" value={data.phone} />
              <Row label="WhatsApp" value={data.whatsapp} />
              <Row label="Email" value={data.email} />
              <Row label="Emergency" value={data.emergencyContact} />
              <Row label="Address" value={data.address} />
            </div>
          )}
          {data.notes && (
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Notes
              </p>
              <p className="text-sm">{data.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
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
