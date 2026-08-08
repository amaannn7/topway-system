"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { storeImage, storeImageOrPdf, deleteUpload, UploadError } from "@/lib/uploads";

// Legacy business rule (Phase 1 §7 rule 7): headshot is always derived from
// the full-body photo, never uploaded standalone. The original used
// face-api.js client-side to auto-frame the crop with manual drag/zoom
// adjustment; this ships a simpler server-side centered crop (a 3:4 portrait
// window centered horizontally, biased toward the top third where a face
// usually sits in a standing full-body photo). Revisit with real face
// detection as a follow-up if the centered crop proves unreliable in
// practice.
async function deriveHeadshot(fullPhotoBuffer: Buffer): Promise<Buffer> {
  const image = sharp(fullPhotoBuffer);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return fullPhotoBuffer;

  const cropWidth = Math.round(width * 0.55);
  const cropHeight = Math.round(cropWidth * (4 / 3));
  const left = Math.round((width - cropWidth) / 2);
  const top = Math.max(0, Math.round(height * 0.03));

  return sharp(fullPhotoBuffer)
    .extract({
      left,
      top,
      width: Math.min(cropWidth, width - left),
      height: Math.min(cropHeight, height - top),
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function uploadFullPhoto(applicantId: string, formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new UploadError("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const subdir = `applicants/${applicantId}`;

  const fullPhoto = await storeImage(file, subdir);
  const headshotBuffer = await deriveHeadshot(buffer);
  const headshotFile = new File([new Uint8Array(headshotBuffer)], "headshot.jpg", {
    type: "image/jpeg",
  });
  const headshot = await storeImage(headshotFile, subdir);

  const [oldFull, oldHeadshot] = await Promise.all([
    prisma.applicantPhoto.findUnique({
      where: { applicantId_kind: { applicantId, kind: "FULL_BODY" } },
    }),
    prisma.applicantPhoto.findUnique({
      where: { applicantId_kind: { applicantId, kind: "HEADSHOT" } },
    }),
  ]);

  await prisma.$transaction([
    prisma.applicantPhoto.upsert({
      where: { applicantId_kind: { applicantId, kind: "FULL_BODY" } },
      update: { url: fullPhoto.url },
      create: { applicantId, kind: "FULL_BODY", url: fullPhoto.url },
    }),
    prisma.applicantPhoto.upsert({
      where: { applicantId_kind: { applicantId, kind: "HEADSHOT" } },
      update: { url: headshot.url },
      create: { applicantId, kind: "HEADSHOT", url: headshot.url },
    }),
  ]);

  await Promise.all([deleteUpload(oldFull?.url), deleteUpload(oldHeadshot?.url)]);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: "Uploaded full photo (headshot auto-derived)",
  });

  revalidatePath(`/admin/applicants/${applicantId}`);
  revalidatePath(`/admin/applicants/${applicantId}/documents`);
  revalidatePath(`/admin/applicants`);
}

export async function removePhoto(applicantId: string, kind: "HEADSHOT" | "FULL_BODY") {
  const admin = await requireAdmin();
  const existing = await prisma.applicantPhoto.findUnique({
    where: { applicantId_kind: { applicantId, kind } },
  });
  if (!existing) return;

  await prisma.applicantPhoto.delete({
    where: { applicantId_kind: { applicantId, kind } },
  });
  await deleteUpload(existing.url);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: `Removed ${kind === "HEADSHOT" ? "headshot" : "full photo"}`,
  });

  revalidatePath(`/admin/applicants/${applicantId}`);
  revalidatePath(`/admin/applicants/${applicantId}/documents`);
  revalidatePath(`/admin/applicants`);
}

export async function uploadDocument(
  applicantId: string,
  kind: "PASSPORT" | "ALTERATION_PAGE",
  formData: FormData
) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new UploadError("No file provided");

  const subdir = `applicants/${applicantId}`;
  const stored = await storeImageOrPdf(file, subdir);

  const existing = await prisma.applicantDocument.findUnique({
    where: { applicantId_kind: { applicantId, kind } },
  });

  await prisma.applicantDocument.upsert({
    where: { applicantId_kind: { applicantId, kind } },
    update: { url: stored.url, mimeType: stored.mimeType },
    create: { applicantId, kind, url: stored.url, mimeType: stored.mimeType },
  });
  await deleteUpload(existing?.url);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: `Uploaded ${kind === "PASSPORT" ? "passport scan" : "alteration page"}`,
  });

  revalidatePath(`/admin/applicants/${applicantId}/documents`);
}

export async function removeDocument(applicantId: string, kind: "PASSPORT" | "ALTERATION_PAGE") {
  const admin = await requireAdmin();
  const existing = await prisma.applicantDocument.findUnique({
    where: { applicantId_kind: { applicantId, kind } },
  });
  if (!existing) return;

  await prisma.applicantDocument.delete({
    where: { applicantId_kind: { applicantId, kind } },
  });
  await deleteUpload(existing.url);

  await logAudit({
    adminUserId: admin.id,
    action: "UPDATE",
    entityType: "Applicant",
    entityId: applicantId,
    summary: `Removed ${kind === "PASSPORT" ? "passport scan" : "alteration page"}`,
  });

  revalidatePath(`/admin/applicants/${applicantId}/documents`);
}
