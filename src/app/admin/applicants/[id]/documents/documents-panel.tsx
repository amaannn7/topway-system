"use client";

import { UploadSlot } from "@/components/upload-slot";
import { uploadFullPhoto, removePhoto, uploadDocument, removeDocument } from "./actions";

export function DocumentsPanel({
  applicantId,
  fullPhotoUrl,
  headshotUrl,
  passport,
  alteration,
}: {
  applicantId: string;
  fullPhotoUrl: string | null;
  headshotUrl: string | null;
  passport: { url: string; mimeType: string } | null;
  alteration: { url: string; mimeType: string } | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-6 sm:justify-start">
        <UploadSlot
          label="Full body photo"
          hint="Headshot is auto-derived from this"
          currentUrl={fullPhotoUrl}
          accept="image/png,image/jpeg,image/webp"
          aspectClassName="aspect-[3/4] h-56 w-44"
          onUpload={(fd) => uploadFullPhoto(applicantId, fd)}
          onRemove={
            fullPhotoUrl ? () => removePhoto(applicantId, "FULL_BODY") : undefined
          }
        />
        <UploadSlot
          label="Headshot"
          hint="Auto-derived; upload full photo to update"
          currentUrl={headshotUrl}
          accept="image/png,image/jpeg,image/webp"
          aspectClassName="aspect-[3/4] h-56 w-44"
          onUpload={(fd) => uploadFullPhoto(applicantId, fd)}
          onRemove={headshotUrl ? () => removePhoto(applicantId, "HEADSHOT") : undefined}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-6 sm:justify-start">
        <UploadSlot
          label="Passport photo / scan"
          currentUrl={passport?.url ?? null}
          isPdf={passport?.mimeType === "application/pdf"}
          accept="image/png,image/jpeg,image/webp,application/pdf"
          aspectClassName="aspect-[4/3] h-40 w-56"
          onUpload={(fd) => uploadDocument(applicantId, "PASSPORT", fd)}
          onRemove={passport ? () => removeDocument(applicantId, "PASSPORT") : undefined}
        />
        <UploadSlot
          label="Alteration & observation page"
          currentUrl={alteration?.url ?? null}
          isPdf={alteration?.mimeType === "application/pdf"}
          accept="image/png,image/jpeg,image/webp,application/pdf"
          aspectClassName="aspect-[4/3] h-40 w-56"
          onUpload={(fd) => uploadDocument(applicantId, "ALTERATION_PAGE", fd)}
          onRemove={
            alteration ? () => removeDocument(applicantId, "ALTERATION_PAGE") : undefined
          }
        />
      </div>
    </div>
  );
}
