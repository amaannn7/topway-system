"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Repeat, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { logDispute, remarketApplicant } from "./actions";

type DisputeCategory = "RUNAWAY" | "REFUSAL_TO_WORK" | "MEDICALLY_UNFIT" | "OTHER";

const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  RUNAWAY: "Runaway",
  REFUSAL_TO_WORK: "Refusal to work",
  MEDICALLY_UNFIT: "Medically unfit",
  OTHER: "Other",
};

const DISPUTE_CATEGORY_STYLES: Record<DisputeCategory, string> = {
  RUNAWAY: "bg-destructive/10 text-destructive border-destructive/25",
  REFUSAL_TO_WORK: "bg-warning/15 text-warning-foreground border-warning/30",
  MEDICALLY_UNFIT: "bg-info/10 text-info border-info/25",
  OTHER: "bg-muted text-muted-foreground border-transparent",
};

function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

type Dispute = {
  id: string;
  category: DisputeCategory;
  notes: string | null;
  reportedAt: string;
  reportedByName: string;
};

type RemarketingRecord = {
  id: string;
  remarketedAt: string;
  notes: string | null;
  previousAgentCompany: string | null;
  disputeCategory: DisputeCategory | null;
  createdByName: string | null;
};

export function HistoryPanel({
  applicantId,
  currentAgentCompany,
  disputes,
  remarketingRecords,
}: {
  applicantId: string;
  currentAgentCompany: string | null;
  disputes: Dispute[];
  remarketingRecords: RemarketingRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [category, setCategory] = useState<DisputeCategory | "">("");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [remarketNotes, setRemarketNotes] = useState("");
  const [linkedDisputeId, setLinkedDisputeId] = useState("");

  function submitDispute() {
    if (!category) {
      toast.error("Choose a dispute category");
      return;
    }
    startTransition(async () => {
      try {
        await logDispute(applicantId, { category, notes: disputeNotes });
        toast.success("Dispute logged");
        setCategory("");
        setDisputeNotes("");
        router.refresh();
      } catch {
        toast.error("Could not log dispute");
      }
    });
  }

  function submitRemarket() {
    startTransition(async () => {
      try {
        await remarketApplicant(applicantId, {
          disputeId: linkedDisputeId || undefined,
          notes: remarketNotes,
        });
        toast.success("Candidate reopened for remarketing");
        setRemarketNotes("");
        setLinkedDisputeId("");
        router.refresh();
      } catch {
        toast.error("Could not remarket candidate");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Log a dispute</CardTitle>
          <CardDescription>
            Runaway, refusal to work, medically unfit, or another issue reported for this
            candidate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Category</Label>
            <Select value={category || null} onValueChange={(v) => setCategory((v as DisputeCategory) ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISPUTE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Notes</Label>
            <Textarea
              rows={3}
              placeholder="What happened, and who reported it…"
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
            />
          </div>
          <Button onClick={submitDispute} disabled={pending} className="self-end">
            {pending ? "Saving…" : "Log dispute"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Remarket this candidate</CardTitle>
          <CardDescription>
            {currentAgentCompany
              ? `Currently assigned to ${currentAgentCompany}. Remarketing clears this assignment and reopens the candidate in Browse & Request.`
              : "No agent is currently assigned, so there's nothing to remarket. The candidate is already visible in Browse & Request."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {currentAgentCompany ? (
            <>
              {disputes.length > 0 && (
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground uppercase">
                    Link to a dispute (optional)
                  </Label>
                  <Select value={linkedDisputeId || null} onValueChange={(v) => setLinkedDisputeId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No linked dispute" />
                    </SelectTrigger>
                    <SelectContent>
                      {disputes.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {DISPUTE_CATEGORY_LABELS[d.category]} · {fmtDateTime(d.reportedAt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground uppercase">Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Reason for remarketing…"
                  value={remarketNotes}
                  onChange={(e) => setRemarketNotes(e.target.value)}
                />
              </div>
              <Button onClick={submitRemarket} disabled={pending} variant="outline" className="self-end">
                <Repeat className="size-4" />
                {pending ? "Reopening…" : "Remarket candidate"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Assign this candidate to an agent first if you need to remarket them later.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">History</CardTitle>
          <CardDescription>Past disputes and remarketing events, most recent first.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {disputes.length === 0 && remarketingRecords.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No disputes or remarketing events recorded yet.
            </p>
          )}
          {remarketingRecords.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 rounded-lg border border-l-4 border-l-purple bg-card px-3.5 py-2.5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple/10 text-purple">
                <Repeat className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Remarketed
                  {r.previousAgentCompany && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      (was with {r.previousAgentCompany})
                    </span>
                  )}
                </p>
                {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  {fmtDateTime(r.remarketedAt)}
                  {r.createdByName && ` · ${r.createdByName}`}
                </p>
              </div>
              {r.disputeCategory && (
                <Badge variant="outline" className={cn("border text-xs", DISPUTE_CATEGORY_STYLES[r.disputeCategory])}>
                  {DISPUTE_CATEGORY_LABELS[r.disputeCategory]}
                </Badge>
              )}
            </div>
          ))}
          {disputes.map((d) => (
            <div
              key={d.id}
              className="flex items-start gap-3 rounded-lg border border-l-4 border-l-destructive/60 bg-card px-3.5 py-2.5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Dispute reported</p>
                {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  {fmtDateTime(d.reportedAt)} · {d.reportedByName}
                </p>
              </div>
              <Badge variant="outline" className={cn("border text-xs", DISPUTE_CATEGORY_STYLES[d.category])}>
                {DISPUTE_CATEGORY_LABELS[d.category]}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
