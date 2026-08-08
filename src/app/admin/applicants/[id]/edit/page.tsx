import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApplicantForm } from "../../applicant-form";
import type { ApplicantFormValues } from "@/lib/validations/applicant";

function toDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function EditApplicantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    include: { employmentHistory: { orderBy: { sortOrder: "asc" } } },
  });
  if (!applicant) notFound();

  const defaultValues: Partial<ApplicantFormValues> = {
    refNo: applicant.refNo ?? "",
    name: applicant.name,
    role: applicant.role,
    contract: applicant.contract,
    nationality: applicant.nationality ?? "",
    religion: applicant.religion ?? "",
    dateOfBirth: toDateInput(applicant.dateOfBirth),
    age: applicant.age ?? "",
    heightCm: applicant.heightCm ?? "",
    weightKg: applicant.weightKg ?? "",
    maritalStatus: applicant.maritalStatus ?? "",
    children: applicant.children ?? "",
    passportNo: applicant.passportNo ?? "",
    passportIssuedAt: applicant.passportIssuedAt ?? "",
    passportIssueDate: toDateInput(applicant.passportIssueDate),
    passportExpiryDate: toDateInput(applicant.passportExpiryDate),
    educationLevel: applicant.educationLevel ?? "",
    educationYear: applicant.educationYear ?? "",
    skillCleaning: applicant.skillCleaning,
    skillWashing: applicant.skillWashing,
    skillBabysitting: applicant.skillBabysitting,
    skillCooking: applicant.skillCooking,
    skillDriving: applicant.skillDriving,
    englishSpeaking: applicant.englishSpeaking,
    englishWriting: applicant.englishWriting,
    arabicSpeaking: applicant.arabicSpeaking,
    arabicWriting: applicant.arabicWriting,
    footerLine1: applicant.footerLine1 ?? "",
    footerLine2: applicant.footerLine2 ?? "",
    footerLine3: applicant.footerLine3 ?? "",
    phone: applicant.phone ?? "",
    whatsapp: applicant.whatsapp ?? "",
    email: applicant.email ?? "",
    emergencyContact: applicant.emergencyContact ?? "",
    address: applicant.address ?? "",
    employmentHistory: applicant.employmentHistory.map((r) => ({
      position: r.position,
      country: r.country,
      period: r.period,
    })),
  };

  return <ApplicantForm applicantId={applicant.id} defaultValues={defaultValues} />;
}
