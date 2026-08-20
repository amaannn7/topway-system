"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleRequest } from "../../browse/actions";

export function RequestActionButton({
  applicantId,
  requested,
}: {
  applicantId: string;
  requested: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await toggleRequest(applicantId);
        toast.success(result === "requested" ? "Request sent to admin" : "Request cancelled");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update request");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={requested ? "outline" : "default"}
      disabled={pending}
      onClick={handleClick}
    >
      {requested ? "Requested (cancel)" : "Request this profile"}
    </Button>
  );
}
