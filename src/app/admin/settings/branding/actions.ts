"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { storeImage, deleteUpload, UploadError } from "@/lib/uploads";
import { orgDefaultsSchema } from "@/lib/validations/org-settings";

// Replaces the legacy's "__global__" fake applicant record — a real
// hack where the shared header logo was smuggled into profiles.json as a
// profile with id "__global__" and an empty fields object, purely so the
// existing per-record image-upload plumbing could be reused (Phase 1
// design note under §2.1). This is now a plain OrgSettings field.
export async function uploadOrgLogo(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new UploadError("No file provided");

  const stored = await storeImage(file, "org");
  const existing = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: { headerLogoUrl: stored.url },
    create: { id: "singleton", headerLogoUrl: stored.url },
  });
  await deleteUpload(existing?.headerLogoUrl);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "OrgSettings",
    entityId: "singleton",
    summary: "Uploaded shared header logo",
  });

  revalidatePath("/admin/settings/branding");
}

export async function saveOrgDefaults(raw: unknown) {
  const admin = await requireAdmin();
  const values = orgDefaultsSchema.parse(raw);

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: values,
    create: { id: "singleton", ...values },
  });

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "OrgSettings",
    entityId: "singleton",
    summary: "Updated organization defaults (footer, bank details)",
  });

  revalidatePath("/admin/settings/branding");
}

export async function removeOrgLogo() {
  const admin = await requireAdmin();
  const existing = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
  if (!existing?.headerLogoUrl) return;

  await prisma.orgSettings.update({ where: { id: "singleton" }, data: { headerLogoUrl: null } });
  await deleteUpload(existing.headerLogoUrl);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "OrgSettings",
    entityId: "singleton",
    summary: "Removed shared header logo",
  });

  revalidatePath("/admin/settings/branding");
}
