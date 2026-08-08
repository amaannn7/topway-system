"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { storeImage, deleteUpload, UploadError } from "@/lib/uploads";
import { agentFormSchema } from "@/lib/validations/agent";

export async function createAgent(raw: unknown) {
  const admin = await requireAdmin();
  const values = agentFormSchema.parse(raw);
  if (!values.password) {
    throw new Error("Password is required for a new agent");
  }

  const existing = await prisma.agent.findUnique({ where: { username: values.username } });
  if (existing) throw new Error("That username is already taken");

  const passwordHash = await bcrypt.hash(values.password, 10);
  const agent = await prisma.agent.create({
    data: {
      name: values.name,
      company: values.company,
      country: values.country,
      username: values.username,
      passwordHash,
      active: values.active,
    },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "CREATE",
    entityType: "Agent",
    entityId: agent.id,
    summary: `Created agent account for ${agent.company}`,
  });

  revalidatePath("/admin/agents");
  redirect(`/admin/agents/${agent.id}`);
}

export async function updateAgent(agentId: string, raw: unknown) {
  const admin = await requireAdmin();
  const values = agentFormSchema.parse(raw);

  const existing = await prisma.agent.findUnique({ where: { username: values.username } });
  if (existing && existing.id !== agentId) {
    throw new Error("That username is already taken");
  }

  const data: {
    name: string;
    company: string;
    country: string;
    username: string;
    active: boolean;
    passwordHash?: string;
  } = {
    name: values.name,
    company: values.company,
    country: values.country,
    username: values.username,
    active: values.active,
  };
  if (values.password) {
    data.passwordHash = await bcrypt.hash(values.password, 10);
  }

  await prisma.agent.update({ where: { id: agentId }, data });

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Agent",
    entityId: agentId,
    summary: `Updated agent account for ${values.company}`,
  });

  revalidatePath("/admin/agents");
  revalidatePath(`/admin/agents/${agentId}`);
}

export async function deleteAgent(agentId: string) {
  const admin = await requireAdmin();
  const agent = await prisma.agent.findUnique({ where: { id: agentId }, select: { company: true, logoUrl: true } });
  if (!agent) throw new Error("Agent not found");

  await prisma.agent.delete({ where: { id: agentId } });
  await deleteUpload(agent.logoUrl);

  await logAudit({
    adminUserId: admin.id,
    action: "DELETE",
    entityType: "Agent",
    entityId: agentId,
    summary: `Deleted agent account for ${agent.company}`,
  });

  revalidatePath("/admin/agents");
}

export async function uploadAgentLogo(agentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new UploadError("No file provided");

  const stored = await storeImage(file, `agents/${agentId}`);
  const existing = await prisma.agent.findUnique({ where: { id: agentId }, select: { logoUrl: true } });

  await prisma.agent.update({ where: { id: agentId }, data: { logoUrl: stored.url } });
  await deleteUpload(existing?.logoUrl);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Agent",
    entityId: agentId,
    summary: "Uploaded agency logo",
  });

  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/admin/agents");
}

export async function removeAgentLogo(agentId: string) {
  const admin = await requireAdmin();
  const existing = await prisma.agent.findUnique({ where: { id: agentId }, select: { logoUrl: true } });
  if (!existing?.logoUrl) return;

  await prisma.agent.update({ where: { id: agentId }, data: { logoUrl: null } });
  await deleteUpload(existing.logoUrl);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Agent",
    entityId: agentId,
    summary: "Removed agency logo",
  });

  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/admin/agents");
}

// Sets the full assignment list for an agent in one call — matches the
// legacy assign_applicants action's replace-all semantics (Phase 1 §2.2),
// and clears any matching pending requests since assigning IS approving.
export async function setAgentAssignments(agentId: string, applicantIds: string[]) {
  const admin = await requireAdmin();

  await prisma.$transaction([
    prisma.agentAssignment.deleteMany({ where: { agentId } }),
    ...(applicantIds.length
      ? [
          prisma.agentAssignment.createMany({
            data: applicantIds.map((applicantId) => ({ agentId, applicantId })),
          }),
        ]
      : []),
    prisma.agentRequest.updateMany({
      where: { agentId, applicantId: { in: applicantIds }, status: "PENDING" },
      data: { status: "APPROVED", resolvedAt: new Date() },
    }),
  ]);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Agent",
    entityId: agentId,
    summary: `Set profile assignments (${applicantIds.length} assigned)`,
  });

  revalidatePath("/admin/agents");
  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath(`/admin/agents/${agentId}/assigned`);
  revalidatePath("/admin/requests");
}

export async function saveOrgSettings(allowAgentBrowse: boolean) {
  const admin = await requireAdmin();
  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: { allowAgentBrowse },
    create: { id: "singleton", allowAgentBrowse },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "OrgSettings",
    entityId: "singleton",
    summary: allowAgentBrowse
      ? "Enabled agent browse & request access"
      : "Disabled agent browse & request access",
  });

  revalidatePath("/admin/agents");
  revalidatePath("/admin/settings");
}
