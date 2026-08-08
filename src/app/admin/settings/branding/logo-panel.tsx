"use client";

import { UploadSlot } from "@/components/upload-slot";
import { uploadOrgLogo, removeOrgLogo } from "./actions";

export function OrgLogoPanel({ logoUrl }: { logoUrl: string | null }) {
  return (
    <UploadSlot
      label="Shared header logo"
      hint="Shown on every applicant PDF unless an agent has their own logo"
      currentUrl={logoUrl}
      accept="image/png,image/jpeg,image/webp"
      aspectClassName="aspect-[2/1] h-28 w-56"
      onUpload={(fd) => uploadOrgLogo(fd)}
      onRemove={logoUrl ? () => removeOrgLogo() : undefined}
    />
  );
}
