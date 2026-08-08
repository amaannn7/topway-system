// Single source of truth for the derived applicant status. The legacy
// system computed this independently in admin.html and agent.html with
// subtly different delay thresholds (Phase 1 §6) — this replaces both.

export type PipelineStepLite = { completed: boolean };

export type DerivedStatus =
  | "READY"
  | "COMPLETE"
  | "PROGRESS"
  | "PENDING"
  | "SENT"
  | "CANCELLED";

export const STATUS_LABEL: Record<DerivedStatus, string> = {
  READY: "Ready to travel",
  COMPLETE: "Fully processed",
  PROGRESS: "In progress",
  PENDING: "Not started",
  SENT: "Sent",
  CANCELLED: "Cancelled",
};

export function deriveStatus(applicant: {
  pipelineStatus: "ACTIVE" | "SENT" | "CANCELLED";
  ticketDate: Date | null;
  pipelineSteps: PipelineStepLite[];
}): DerivedStatus {
  if (applicant.pipelineStatus === "SENT") return "SENT";
  if (applicant.pipelineStatus === "CANCELLED") return "CANCELLED";

  const total = applicant.pipelineSteps.length;
  const done = applicant.pipelineSteps.filter((s) => s.completed).length;

  if (total > 0 && done === total && applicant.ticketDate) return "READY";
  if (total > 0 && done === total) return "COMPLETE";
  if (done > 0) return "PROGRESS";
  return "PENDING";
}

export type DelaySeverity = "ok" | "warn" | "late" | "none";

// One threshold set, used everywhere (legacy had 30/60 in admin.html and
// 60/120 in agent.html — Phase 1 §6 flagged this as a bug, not a feature).
export function delaySeverity(musanedDate: Date | null): {
  days: number | null;
  severity: DelaySeverity;
} {
  if (!musanedDate) return { days: null, severity: "none" };
  const days = Math.floor((Date.now() - musanedDate.getTime()) / 86_400_000);
  if (days < 30) return { days, severity: "ok" };
  if (days < 60) return { days, severity: "warn" };
  return { days, severity: "late" };
}
