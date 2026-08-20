import { prisma } from "@/lib/prisma";
import { deriveStatus, type DerivedStatus } from "@/lib/pipeline-status";
import type { Prisma } from "@/generated/prisma/client";

// Single source of truth for what an agent is allowed to see on an
// applicant. The legacy API endpoints (agent_applicants.php,
// profile_for_agent.php) each independently stripped a slightly different
// field set — this centralizes it so there's exactly one place that
// decides what crosses the admin/agent boundary (Phase 1 §7 rules 4–5):
//   - never: phone, whatsapp, email, emergencyContact, address (internal
//     contact info)
//   - never: pipeline step completion dates, or the `confirmed` flag itself
//   - passport/alteration documents: only once `confirmed` is true

const agentApplicantArgs = {
  select: {
    id: true,
    refNo: true,
    name: true,
    role: true,
    contract: true,
    age: true,
    nationality: true,
    religion: true,
    dateOfBirth: true,
    heightCm: true,
    weightKg: true,
    maritalStatus: true,
    children: true,
    passportNo: true,
    passportIssuedAt: true,
    passportIssueDate: true,
    passportExpiryDate: true,
    educationLevel: true,
    educationYear: true,
    skillCleaning: true,
    skillWashing: true,
    skillBabysitting: true,
    skillCooking: true,
    skillDriving: true,
    englishSpeaking: true,
    englishWriting: true,
    arabicSpeaking: true,
    arabicWriting: true,
    footerLine1: true,
    footerLine2: true,
    footerLine3: true,
    pipelineStatus: true,
    workerCategory: true,
    experienceType: true,
    confirmed: true, // used server-side to gate documents below, stripped before returning
    musanedDate: true,
    ticketDate: true,
    saudiAgentVisaDate: true,
    departureDate: true,
    destinationCountry: true,
    notes: true,
    employmentHistory: { orderBy: { sortOrder: "asc" } },
    photos: true,
    documents: true,
    pipelineSteps: { select: { key: true, completed: true } },
  },
} satisfies Prisma.ApplicantDefaultArgs;

type AgentApplicantRecord = Prisma.ApplicantGetPayload<typeof agentApplicantArgs>;

export type AgentApplicantView = ReturnType<typeof toAgentView>;

function toAgentView(applicant: AgentApplicantRecord) {
  const { confirmed, documents, ...rest } = applicant;
  return {
    ...rest,
    status: deriveStatus(applicant) as DerivedStatus,
    headshotUrl: applicant.photos.find((p) => p.kind === "HEADSHOT")?.url ?? null,
    fullPhotoUrl: applicant.photos.find((p) => p.kind === "FULL_BODY")?.url ?? null,
    // Only exposed once admin has explicitly confirmed the candidate.
    documents: confirmed ? documents : [],
  };
}

export async function getAgentApplicants(agentId: string) {
  const assignments = await prisma.agentAssignment.findMany({
    where: { agentId },
    // Matches the legacy portal's natural order (creation order / ascending
    // refNo) rather than assignment order.
    orderBy: { applicant: { createdAt: "asc" } },
    include: { applicant: agentApplicantArgs },
  });
  return assignments.map((a) => toAgentView(a.applicant));
}

export async function getAgentApplicant(agentId: string, applicantId: string) {
  const assignment = await prisma.agentAssignment.findUnique({
    where: { agentId_applicantId: { agentId, applicantId } },
  });

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    ...agentApplicantArgs,
  });
  if (!applicant) return null;

  // Not yet assigned to this agent — still viewable/downloadable from the
  // browse pool (same rule as getBrowsePool: excluded once SENT, and only
  // when browse is turned on org-wide), just not through an AgentAssignment
  // row.
  if (!assignment) {
    if (applicant.pipelineStatus === "SENT") return null;
    const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
    if (!settings?.allowAgentBrowse) return null;
  }

  return toAgentView(applicant);
}

// Customer Portal — same field-stripping rules as the agent view above (a
// customer sees strictly a subset of what their sponsoring agent sees,
// never more), joined through CustomerShare instead of AgentAssignment.
export async function getCustomerApplicants(customerId: string) {
  const shares = await prisma.customerShare.findMany({
    where: { customerId },
    orderBy: { applicant: { createdAt: "asc" } },
    include: { applicant: agentApplicantArgs },
  });
  return shares.map((s) => toAgentView(s.applicant));
}

export async function getCustomerApplicant(customerId: string, applicantId: string) {
  const share = await prisma.customerShare.findUnique({
    where: { customerId_applicantId: { customerId, applicantId } },
  });
  if (!share) return null;

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    ...agentApplicantArgs,
  });
  if (!applicant) return null;

  return toAgentView(applicant);
}

// Browse pool: unassigned-to-this-agent, unsent (Phase 1 §7 rule 9), plus
// this agent's own status against each (available/requested/assigned).
export async function getBrowsePool(agentId: string) {
  const [assignments, requests, applicants] = await Promise.all([
    prisma.agentAssignment.findMany({ where: { agentId }, select: { applicantId: true } }),
    prisma.agentRequest.findMany({
      where: { agentId, status: "PENDING" },
      select: { applicantId: true },
    }),
    prisma.applicant.findMany({
      where: { pipelineStatus: { not: "SENT" } },
      // Matches the legacy portal's natural order (creation order / ascending
      // refNo) rather than alphabetical.
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        age: true,
        experienceType: true,
        photos: { where: { kind: "HEADSHOT" }, select: { url: true }, take: 1 },
      },
    }),
  ]);

  const assignedIds = new Set(assignments.map((a) => a.applicantId));
  const requestedIds = new Set(requests.map((r) => r.applicantId));

  return applicants.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    age: a.age,
    experienceType: a.experienceType,
    headshotUrl: a.photos[0]?.url ?? null,
    status: assignedIds.has(a.id)
      ? ("assigned" as const)
      : requestedIds.has(a.id)
        ? ("requested" as const)
        : ("available" as const),
  }));
}
