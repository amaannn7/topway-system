"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
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
} from "@/lib/constants/applicant";
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
    pipelineStatus: "ACTIVE" | "SENT" | "CANCELLED";
    musanedDate: Date | null;
    ticketDate: Date | null;
    saudiAgentVisaDate: Date | null;
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
  const [sent, setSent] = useState(applicant.pipelineStatus === "SENT");
  const [musanedDate, setMusanedDate] = useState(toDateInput(applicant.musanedDate));
  const [ticketDate, setTicketDate] = useState(toDateInput(applicant.ticketDate));
  const [saudiAgentVisaDate, setSaudiAgentVisaDate] = useState(
    toDateInput(applicant.saudiAgentVisaDate)
  );
  const [notes, setNotes] = useState(applicant.notes ?? "");

  function save() {
    startTransition(async () => {
      try {
        await updatePipeline({
          applicantId: applicant.id,
          steps: PIPELINE_STEPS.map((s) => ({ key: s.key, completed: !!steps[s.key] })),
          workerCategory: workerCategory || null,
          experienceType: experienceType || null,
          confirmed,
          pipelineStatus: sent ? "SENT" : "ACTIVE",
          musanedDate,
          ticketDate,
          saudiAgentVisaDate,
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Processing steps</CardTitle>
          <CardDescription>
            Fixed order: Medical → Enjaz → Bureau → Wakalah → Embassy → Payment.
          </CardDescription>
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
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    checked
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      checked ? "border-success bg-success text-white" : "border-border"
                    )}
                  >
                    {checked && <Check className="size-3" />}
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
                "rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors",
                confirmed
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {confirmed ? "✓ Candidate confirmed" : "○ Mark as confirmed"}
              <p className="text-xs font-normal opacity-80">
                Unlocks passport documents for the assigned agent.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSent((v) => !v)}
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors",
                sent
                  ? "border-secondary/50 bg-secondary/15 text-secondary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {sent ? "✓ Applicant sent" : "○ Mark as sent"}
              <p className="text-xs font-normal opacity-80">
                Removes this applicant from the agent browse pool.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
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
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Notes</Label>
            <Textarea
              rows={3}
              placeholder="e.g. CANCELLED, or any remarks…"
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
