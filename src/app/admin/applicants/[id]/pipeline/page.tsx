import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PipelineForm } from "./pipeline-form";

export default async function ApplicantPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id },
    select: {
      id: true,
      workerCategory: true,
      experienceType: true,
      confirmed: true,
      pipelineStatus: true,
      musanedDate: true,
      ticketDate: true,
      saudiAgentVisaDate: true,
      notes: true,
      pipelineSteps: { select: { key: true, completed: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!applicant) notFound();

  return <PipelineForm applicant={applicant} />;
}
