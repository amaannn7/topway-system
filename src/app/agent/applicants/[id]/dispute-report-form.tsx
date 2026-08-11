"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
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
import { reportDispute } from "./actions";

type DisputeCategory = "RUNAWAY" | "REFUSAL_TO_WORK" | "MEDICALLY_UNFIT" | "OTHER";

const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  RUNAWAY: "Runaway",
  REFUSAL_TO_WORK: "Refusal to work",
  MEDICALLY_UNFIT: "Medically unfit",
  OTHER: "Other",
};

// Lets an agent tell Topway about a placement issue directly instead of
// relaying it by phone/email — this is report-only. Resolving it (opening
// a remarketing case) stays an admin action, same approval boundary
// AgentRequest already enforces for Browse & Request.
export function DisputeReportForm({ applicantId }: { applicantId: string }) {
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<DisputeCategory | "">("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!category) {
      toast.error("Choose a category");
      return;
    }
    startTransition(async () => {
      try {
        await reportDispute(applicantId, { category, notes });
        toast.success("Reported to Topway");
        setCategory("");
        setNotes("");
        setSubmitted(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not submit report");
      }
    });
  }

  return (
    <Card className="border-l-4 border-l-destructive/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4 text-destructive" />
          Report an issue
        </CardTitle>
        <CardDescription>
          Let Topway know if this candidate needs a change of employer or house.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {submitted && (
          <p className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">
            Thanks. Topway staff will follow up.
          </p>
        )}
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
            placeholder="What happened…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={pending} variant="outline" className="self-end">
          {pending ? "Sending…" : "Report to Topway"}
        </Button>
      </CardContent>
    </Card>
  );
}
