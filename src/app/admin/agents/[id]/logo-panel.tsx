"use client";

import { UploadSlot } from "@/components/upload-slot";
import { uploadAgentLogo, removeAgentLogo } from "../actions";

export function LogoPanel({ agentId, logoUrl }: { agentId: string; logoUrl: string | null }) {
  return (
    <UploadSlot
      label="Agency logo"
      hint="Shown on CVs this agent downloads"
      currentUrl={logoUrl}
      accept="image/png,image/jpeg,image/webp"
      aspectClassName="aspect-square h-32 w-32"
      onUpload={(fd) => uploadAgentLogo(agentId, fd)}
      onRemove={logoUrl ? () => removeAgentLogo(agentId) : undefined}
    />
  );
}
