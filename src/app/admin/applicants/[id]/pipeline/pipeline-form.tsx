"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ListChecks, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PIPELINE_STEPS,
  WORKER_CATEGORY_LABELS,
  EXPERIENCE_TYPE_LABELS,
  EMPLOYMENT_COUNTRY_OPTIONS,
} from "@/lib/constants/applicant";
import { deriveLifecycleStatus, LIFECYCLE_STATUS_LABEL } from "@/lib/pipeline-status";
import { LifecycleStatusBadge } from "../../lifecycle-status-badge";
import { updatePipeline } from "../../actions";

type StepKey = (typeof PIPELINE_STEPS)[number]["key"];

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function PipelineForm({
  applicant,
}: {
  applicant: {
    id: string;
    workerCategory: string | null;
    experienceType: string | null;
    confirmed: boolean;
    pipelineStatus: "ACTIVE" | "SENT" | "CANCELLED" | "ON_HOLD";
    musanedDate: Date | null;
    ticketDate: Date | null;
    saudiAgentVisaDate: Date | null;
    departureDate: Date | null;
    destinationCountry: string | null;
    notes: string | null;
    pipelineSteps: { key: StepKey; completed: boolean }[];
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [steps, setSteps] = useState(
    Object.fromEntries(applicant.pipelineSteps.map((s) => [s.key, s.completed])) as Record<
      StepKey,
      boolean
    >
  );
  const [workerCategory, setWorkerCategory] = useState(applicant.workerCategory ?? "");
  const [experienceType, setExperienceType] = useState(applicant.experienceType ?? "");
  const [confirmed, setConfirmed] = useState(applicant.confirmed);
  const [pipelineStatus, setPipelineStatus] = useState(applicant.pipelineStatus);
  const [musanedDate, setMusanedDate] = useState(toDateInput(applicant.musanedDate));
  const [ticketDate, setTicketDate] = useState(toDateInput(applicant.ticketDate));
  const [saudiAgentVisaDate, setSaudiAgentVisaDate] = useState(
    toDateInput(applicant.saudiAgentVisaDate)
  );
  const [departureDate, setDepartureDate] = useState(toDateInput(applicant.departureDate));
  const [destinationCountry, setDestinationCountry] = useState(
    applicant.destinationCountry ?? ""
  );
  const [notes, setNotes] = useState(applicant.notes ?? "");

  const lifecyclePreview = deriveLifecycleStatus({
    departureDate: departureDate ? new Date(`${departureDate}T00:00:00.000Z`) : null,
    destinationCountry: destinationCountry || null,
  });

  function save() {
    startTransition(async () => {
      try {
        await updatePipeline({
          applicantId: applicant.id,
          steps: PIPELINE_STEPS.map((s) => ({ key: s.key, completed: !!steps[s.key] })),
          workerCategory: workerCategory || null,
          experienceType: experienceType || null,
          confirmed,
          pipelineStatus,
          musanedDate,
          ticketDate,
          saudiAgentVisaDate,
          departureDate,
          destinationCountry,
          notes,
        });
        toast.success("Pipeline updated");
        router.refresh();
      } catch {
        toast.error("Could not update pipeline");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <ListChecks className="size-4.5" />
          </div>
          <div>
            <CardTitle className="text-sm">Processing steps</CardTitle>
            <CardDescription>
              Fixed order: Medical → Enjaz → Bureau → Wakalah → Embassy → Payment.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PIPELINE_STEPS.map((step) => {
              const checked = !!steps[step.key];
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setSteps((prev) => ({ ...prev, [step.key]: !prev[step.key] }))}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-xs transition-colors",
                    checked
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      checked
                        ? "border-success bg-success text-success-foreground"
                        : "border-muted-foreground/30 bg-background"
                    )}
                  >
                    {checked && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setConfirmed((v) => !v)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium shadow-xs transition-colors",
                confirmed
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  confirmed
                    ? "border-success bg-success text-success-foreground"
                    : "border-muted-foreground/30 bg-background"
                )}
              >
                {confirmed && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span>
                Candidate confirmed
                <p className="text-xs font-normal opacity-80">
                  Unlocks passport documents for the assigned agent.
                </p>
              </span>
            </button>
          </div>

          <div className="mt-4">
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">
              Pipeline status
            </Label>
            <Select
              value={pipelineStatus}
              onValueChange={(v) => setPipelineStatus((v ?? "ACTIVE") as typeof pipelineStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SENT">Sent (removes from agent browse pool)</SelectItem>
                <SelectItem value="ON_HOLD">On hold (temporarily paused)</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {pipelineStatus === "ON_HOLD" && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Paused, not cancelled. Switch back to Active any time to resume processing.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
            <Settings2 className="size-4.5" />
          </div>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">
              Experience type
            </Label>
            <Select
              value={experienceType || null}
              onValueChange={(v) => setExperienceType(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPERIENCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">
              Worker category
            </Label>
            <Select
              value={workerCategory || null}
              onValueChange={(v) => setWorkerCategory(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORKER_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Musaned date</Label>
              <Input type="date" value={musanedDate} onChange={(e) => setMusanedDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Ticket date</Label>
              <Input type="date" value={ticketDate} onChange={(e) => setTicketDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground uppercase">
                Saudi agent visa date
              </Label>
              <Input
                type="date"
                value={saudiAgentVisaDate}
                onChange={(e) => setSaudiAgentVisaDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase">Post-departure lifecycle</Label>
              <LifecycleStatusBadge status={lifecyclePreview.status} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Departure date</Label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground uppercase">
                  Destination country
                </Label>
                <Select
                  value={destinationCountry || null}
                  onValueChange={(v) => setDestinationCountry(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {lifecyclePreview.status !== "NOT_DEPARTED" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {lifecyclePreview.status === "PROBATION_PROGRESS" &&
                  `Probation ends ${lifecyclePreview.probationEndsAt?.toLocaleDateString("en-GB")}.`}
                {lifecyclePreview.status === "PROBATION_COMPLETE" &&
                  `Mid-contract mark on ${lifecyclePreview.midContractAt?.toLocaleDateString("en-GB")}.`}
                {lifecyclePreview.status === "MID_CONTRACT" &&
                  `Contract completes ${lifecyclePreview.contractEndsAt?.toLocaleDateString("en-GB")}.`}
                {lifecyclePreview.status === "CONTRACT_COMPLETE" &&
                  `Eligible for remarketing/reprocessing (${LIFECYCLE_STATUS_LABEL.CONTRACT_COMPLETE}).`}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Notes</Label>
            <Textarea
              rows={3}
              placeholder="Any remarks about this applicant's processing…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={save} disabled={pending} className="self-end">
            {pending ? "Saving…" : "Save status"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
