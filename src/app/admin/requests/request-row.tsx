"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Check, X, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveRequest, rejectRequest } from "./actions";

export function RequestRow({
  request,
}: {
  request: {
    id: string;
    requestedAt: string;
    agentCompany: string;
    applicantName: string;
    applicantRole: string;
    headshotUrl: string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle(action: "approve" | "reject") {
    startTransition(async () => {
      try {
        if (action === "approve") await approveRequest(request.id);
        else await rejectRequest(request.id);
        toast.success(action === "approve" ? "Request approved" : "Request rejected");
        router.refresh();
      } catch {
        toast.error("Could not update request");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      {request.headshotUrl ? (
        <Image
          src={request.headshotUrl}
          alt=""
          width={38}
          height={38}
          className="size-9.5 shrink-0 rounded-full object-cover ring-1 ring-border"
        />
      ) : (
        <div className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {request.applicantName || "(Unnamed)"}
          <span className="ml-2 font-normal text-muted-foreground">{request.applicantRole}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Requested by {request.agentCompany} ·{" "}
          {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(
            new Date(request.requestedAt)
          )}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={pending}
        onClick={() => handle("reject")}
        aria-label="Reject request"
      >
        <X className="size-4" />
      </Button>
      <Button
        size="sm"
        className="rounded-full bg-success text-success-foreground hover:bg-success/85"
        disabled={pending}
        onClick={() => handle("approve")}
      >
        <Check className="size-4" />
        Approve
      </Button>
    </div>
  );
}
