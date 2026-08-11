"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import {
  applicantFormSchema,
  pipelineUpdateSchema,
  type ApplicantFormValues,
} from "@/lib/validations/applicant";

function toDate(value: string | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}
function toInt(value: number | string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildApplicantData(values: ApplicantFormValues) {
  return {
    refNo: values.refNo || null,
    name: values.name,
    role: values.role,
    contract: values.contract,
    nationality: values.nationality || null,
    religion: values.religion || null,
    dateOfBirth: toDate(values.dateOfBirth),
    age: toInt(values.age),
    heightCm: toInt(values.heightCm),
    weightKg: toInt(values.weightKg),
    maritalStatus: values.maritalStatus || null,
    children: toInt(values.children),
    passportNo: values.passportNo || null,
    passportIssuedAt: values.passportIssuedAt || null,
    passportIssueDate: toDate(values.passportIssueDate),
    passportExpiryDate: toDate(values.passportExpiryDate),
    educationLevel: values.educationLevel || null,
    educationYear: toInt(values.educationYear),
    skillCleaning: values.skillCleaning,
    skillWashing: values.skillWashing,
    skillBabysitting: values.skillBabysitting,
    skillCooking: values.skillCooking,
    skillDriving: values.skillDriving,
    englishSpeaking: values.englishSpeaking,
    englishWriting: values.englishWriting,
    arabicSpeaking: values.arabicSpeaking,
    arabicWriting: values.arabicWriting,
    footerLine1: values.footerLine1 || null,
    footerLine2: values.footerLine2 || null,
    footerLine3: values.footerLine3 || null,
    phone: values.phone || null,
    whatsapp: values.whatsapp || null,
    email: values.email || null,
    emergencyContact: values.emergencyContact || null,
    address: values.address || null,
  };
}

// Every new applicant gets all six pipeline steps seeded up front, in fixed
// order, so the pipeline tab never has to handle a "missing step" case —
// Phase 1 §3/§7 rule 1: the six-step order is the one thing that must never
// change.
const PIPELINE_SEED = [
  { key: "MEDICAL" as const, sortOrder: 0 },
  { key: "ENJAZ" as const, sortOrder: 1 },
  { key: "BUREAU" as const, sortOrder: 2 },
  { key: "WAKALAH" as const, sortOrder: 3 },
  { key: "EMBASSY" as const, sortOrder: 4 },
  { key: "PAYMENT" as const, sortOrder: 5 },
];

export async function createApplicant(raw: unknown) {
  const admin = await requireAdmin();
  const values = applicantFormSchema.parse(raw);

  const applicant = await prisma.applicant.create({
    data: {
      ...buildApplicantData(values),
      createdById: admin.id,
      employmentHistory: {
        create: values.employmentHistory.map((row, i) => ({ ...row, sortOrder: i })),
      },
      pipelineSteps: { create: PIPELINE_SEED },
    },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "CREATE",
    entityType: "Applicant",
    entityId: applicant.id,
    summary: `Created applicant profile for ${applicant.name || "(unnamed)"}`,
  });

  revalidatePath("/admin/applicants");
  redirect(`/admin/applicants/${applicant.id}/pipeline`);
}

export async function updateApplicant(applicantId: string, raw: unknown) {
  const admin = await requireAdmin();
  const values = applicantFormSchema.parse(raw);

  await prisma.$transaction([
    prisma.applicant.update({
      where: { id: applicantId },
      data: buildApplicantData(values),
    }),
    prisma.employmentRecord.deleteMany({ where: { applicantId } }),
    ...(values.employmentHistory.length
      ? [
          prisma.employmentRecord.createMany({
            data: values.employmentHistory.map((row, i) => ({
              ...row,
              applicantId,
              sortOrder: i,
            })),
          }),
        ]
      : []),
  ]);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: `Updated profile fields for ${values.name || "(unnamed)"}`,
  });

  revalidatePath("/admin/applicants");
  revalidatePath(`/admin/applicants/${applicantId}`);
}

export async function deleteApplicant(applicantId: string) {
  const admin = await requireAdmin();
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { name: true },
  });
  if (!applicant) throw new Error("Applicant not found");

  await prisma.applicant.delete({ where: { id: applicantId } });

  await logAudit({
    adminUserId: admin.id,
    action: "DELETE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: `Deleted applicant profile for ${applicant.name || "(unnamed)"}`,
  });

  revalidatePath("/admin/applicants");
}

export async function updatePipeline(raw: unknown) {
  const admin = await requireAdmin();
  const values = pipelineUpdateSchema.parse(raw);

  const applicant = await prisma.applicant.findUnique({
    where: { id: values.applicantId },
    select: { name: true },
  });
  if (!applicant) throw new Error("Applicant not found");

  await prisma.$transaction([
    ...values.steps.map((step) =>
      prisma.pipelineStep.update({
        where: { applicantId_key: { applicantId: values.applicantId, key: step.key } },
        data: {
          completed: step.completed,
          completedAt: step.completed ? new Date() : null,
        },
      })
    ),
    prisma.applicant.update({
      where: { id: values.applicantId },
      data: {
        workerCategory: values.workerCategory ?? undefined,
        experienceType: values.experienceType ?? undefined,
        confirmed: values.confirmed,
        pipelineStatus: values.pipelineStatus,
        musanedDate: values.musanedDate ? toDate(values.musanedDate) : undefined,
        ticketDate: values.ticketDate ? toDate(values.ticketDate) : undefined,
        saudiAgentVisaDate: values.saudiAgentVisaDate
          ? toDate(values.saudiAgentVisaDate)
          : undefined,
        departureDate: values.departureDate ? toDate(values.departureDate) : undefined,
        destinationCountry: values.destinationCountry || null,
        notes: values.notes,
      },
    }),
  ]);

  await logAudit({
    adminUserId: admin.id,
    action: "STATUS_CHANGE",
    entityType: "Applicant",
    entityId: values.applicantId,
    summary: `Updated pipeline status for ${applicant.name || "(unnamed)"}`,
    metadata: { steps: values.steps },
  });

  revalidatePath("/admin/applicants");
  revalidatePath(`/admin/applicants/${values.applicantId}`);
}
