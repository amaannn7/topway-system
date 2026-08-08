import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type DerivedStatus } from "@/lib/pipeline-status";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DerivedStatus, string> = {
  READY: "bg-success/15 text-success border-success/30",
  COMPLETE: "bg-primary/10 text-primary border-primary/25",
  PROGRESS: "bg-warning/15 text-warning-foreground border-warning/30",
  PENDING: "bg-muted text-muted-foreground border-transparent",
  SENT: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/25",
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
