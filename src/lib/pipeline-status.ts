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

// Post-departure lifecycle — separate from DerivedStatus above (which only
// covers the pre-departure 6-step pipeline). Probation length depends on
// destinationCountry; unlisted/unknown countries default to 6 months
// (matches the two known non-Saudi cases). Mid-contract is fixed at 12
// months and full completion at 24 months regardless of destination.
export type LifecycleStatus =
  | "NOT_DEPARTED"
  | "PROBATION_PROGRESS"
  | "PROBATION_COMPLETE"
  | "MID_CONTRACT"
  | "CONTRACT_COMPLETE";

export const LIFECYCLE_STATUS_LABEL: Record<LifecycleStatus, string> = {
  NOT_DEPARTED: "Not departed",
  PROBATION_PROGRESS: "Work in progress",
  PROBATION_COMPLETE: "Probation completed",
  MID_CONTRACT: "Mid-contract",
  CONTRACT_COMPLETE: "Contract completed",
};

const PROBATION_MONTHS: Record<string, number> = {
  "Saudi Arabia": 3,
  Kuwait: 6,
  Oman: 6,
};
const DEFAULT_PROBATION_MONTHS = 6;
const MID_CONTRACT_MONTHS = 12;
const CONTRACT_MONTHS = 24;

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function deriveLifecycleStatus(applicant: {
  departureDate: Date | null;
  destinationCountry: string | null;
}): {
  status: LifecycleStatus;
  probationEndsAt: Date | null;
  midContractAt: Date | null;
  contractEndsAt: Date | null;
} {
  if (!applicant.departureDate) {
    return { status: "NOT_DEPARTED", probationEndsAt: null, midContractAt: null, contractEndsAt: null };
  }

  const probationMonths =
    (applicant.destinationCountry ? PROBATION_MONTHS[applicant.destinationCountry] : undefined) ??
    DEFAULT_PROBATION_MONTHS;

  const probationEndsAt = addMonths(applicant.departureDate, probationMonths);
  const midContractAt = addMonths(applicant.departureDate, MID_CONTRACT_MONTHS);
  const contractEndsAt = addMonths(applicant.departureDate, CONTRACT_MONTHS);

  const now = Date.now();
  let status: LifecycleStatus;
  if (now >= contractEndsAt.getTime()) status = "CONTRACT_COMPLETE";
  else if (now >= midContractAt.getTime()) status = "MID_CONTRACT";
  else if (now >= probationEndsAt.getTime()) status = "PROBATION_COMPLETE";
  else status = "PROBATION_PROGRESS";

  return { status, probationEndsAt, midContractAt, contractEndsAt };
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
