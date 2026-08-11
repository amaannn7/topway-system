import { Badge } from "@/components/ui/badge";
import { LIFECYCLE_STATUS_LABEL, type LifecycleStatus } from "@/lib/pipeline-status";
import { cn } from "@/lib/utils";

const LIFECYCLE_STATUS_STYLES: Record<LifecycleStatus, string> = {
  NOT_DEPARTED: "bg-muted text-muted-foreground border-transparent",
  PROBATION_PROGRESS: "bg-warning/15 text-warning-foreground border-warning/30",
  PROBATION_COMPLETE: "bg-info/10 text-info border-info/25",
  MID_CONTRACT: "bg-purple/10 text-purple border-purple/25",
  CONTRACT_COMPLETE: "bg-success/15 text-success border-success/30",
};

export function LifecycleStatusBadge({ status }: { status: LifecycleStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium whitespace-nowrap", LIFECYCLE_STATUS_STYLES[status])}
    >
      {LIFECYCLE_STATUS_LABEL[status]}
    </Badge>
  );
}
