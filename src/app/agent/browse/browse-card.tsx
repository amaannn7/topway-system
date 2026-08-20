"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXPERIENCE_TYPE_LABELS } from "@/lib/constants/applicant";
import { cn } from "@/lib/utils";
import { toggleRequest } from "./actions";

type BrowseStatus = "available" | "requested" | "assigned";

export function BrowseCard({
  applicant,
}: {
  applicant: {
    id: string;
    name: string;
    role: string;
    age: number | null;
    experienceType: string | null;
    headshotUrl: string | null;
    status: BrowseStatus;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (applicant.status === "assigned") return;
    startTransition(async () => {
      try {
        const result = await toggleRequest(applicant.id);
        toast.success(result === "requested" ? "Request sent to admin" : "Request cancelled");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update request");
      }
    });
  }

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        applicant.status === "requested" && "border-l-4 border-l-info bg-gradient-to-br from-info/5 to-transparent",
        applicant.status === "assigned" && "border-l-4 border-l-success bg-gradient-to-br from-success/5 to-transparent"
      )}
    >
      <Link href={`/agent/applicants/${applicant.id}`} className="flex flex-1 flex-col">
        <div className="flex h-32 items-center justify-center bg-muted">
          {applicant.headshotUrl ? (
            <Image
              src={applicant.headshotUrl}
              alt=""
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-6" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="truncate text-sm font-semibold">{applicant.name || "(Unnamed)"}</p>
          <p className="text-xs text-muted-foreground">{applicant.role}</p>
          {applicant.experienceType && (
            <p className="text-xs text-muted-foreground">
              {EXPERIENCE_TYPE_LABELS[applicant.experienceType as keyof typeof EXPERIENCE_TYPE_LABELS]}
            </p>
          )}
          {applicant.age && <p className="text-xs text-muted-foreground">Age: {applicant.age}</p>}
        </div>
      </Link>
      <div className="border-t p-2.5">
        <Button
          size="sm"
          className={cn(
            "w-full rounded-full",
            applicant.status === "assigned" && "bg-success/15 text-success hover:bg-success/15"
          )}
          disabled={pending || applicant.status === "assigned"}
          variant={applicant.status === "available" ? "default" : "outline"}
          onClick={handleClick}
        >
          {applicant.status === "assigned"
            ? "✓ Assigned"
            : applicant.status === "requested"
              ? "Requested (cancel)"
              : "Request"}
        </Button>
      </div>
    </Card>
  );
}
