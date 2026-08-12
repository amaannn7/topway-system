import Image from "next/image";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ApplicantStatusBadge } from "@/app/admin/applicants/applicant-status-badge";
import type { AgentApplicantView } from "@/lib/agent-applicant-view";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

// Preview-only, no download CTA — the spec asks for "review applications
// without receiving CVs individually," so the portal itself is the access
// surface rather than a per-candidate file handout (unlike the agent
// portal's ApplicantCard, which does offer a download).
export function CustomerApplicantCard({ applicant }: { applicant: AgentApplicantView }) {
  const done = applicant.pipelineSteps.filter((s) => s.completed).length;

  return (
    <Card className="flex flex-col overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-44 items-center justify-center bg-muted">
        {applicant.headshotUrl ? (
          <Image
            src={applicant.headshotUrl}
            alt=""
            width={160}
            height={176}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-7" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="font-semibold">{applicant.name || "(Unnamed)"}</p>
        <p className="text-xs text-muted-foreground">{applicant.role}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full ${i < done ? "bg-success" : "bg-muted-foreground/25"}`}
            />
          ))}
          <span className="ml-1 text-xs text-muted-foreground">{done}/6</span>
        </div>
        <div className="mt-1">
          <ApplicantStatusBadge status={applicant.status} />
        </div>
      </div>
      <div className="border-t p-3">
        <PdfPreviewDialog
          pdfUrl={`/customer/applicants/${applicant.id}/cv`}
          fileName={`${applicant.name || "candidate"}-cv.pdf`}
          title={`${applicant.name || "Applicant"} CV`}
          triggerClassName="w-full"
        />
      </div>
    </Card>
  );
}
