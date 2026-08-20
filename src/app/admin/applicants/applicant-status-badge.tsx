import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type DerivedStatus } from "@/lib/pipeline-status";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DerivedStatus, string> = {
  READY: "bg-success/15 text-success border-success/30",
  COMPLETE: "bg-info/10 text-info border-info/25",
  PROGRESS: "bg-warning/15 text-warning-foreground border-warning/30",
  PENDING: "bg-muted text-muted-foreground border-transparent",
  SENT: "bg-secondary text-white border-transparent dark:bg-secondary dark:text-white",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/25",
  ON_HOLD: "bg-amber/15 text-amber-foreground border-amber/30",
};

export function ApplicantStatusBadge({ status }: { status: DerivedStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium whitespace-nowrap", STATUS_STYLES[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
