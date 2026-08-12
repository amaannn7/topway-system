import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-success/15 text-success border-success/30",
  UPDATE: "bg-primary/10 text-primary border-primary/25",
  DELETE: "bg-destructive/10 text-destructive border-destructive/25",
  STATUS_CHANGE: "bg-warning/15 text-warning-foreground border-warning/30",
  LOGIN: "bg-muted text-muted-foreground border-transparent",
};

function fmtWhen(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string }>;
}) {
  const { entityType } = await searchParams;

  const [entries, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { adminUser: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/admin/settings/audit-log"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !entityType
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          All
        </a>
        {entityTypes.map((t) => (
          <a
            key={t.entityType}
            href={`/admin/settings/audit-log?entityType=${encodeURIComponent(t.entityType)}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              entityType === t.entityType
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {t.entityType}
          </a>
        ))}
      </div>

      {entries.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ScrollText className="size-6" />
          </div>
          <p>No activity recorded yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="flex flex-row items-center gap-3 px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md"
            >
              <Badge
                variant="outline"
                className={`shrink-0 border font-medium ${ACTION_STYLES[entry.action] ?? ""}`}
              >
                {entry.action.replace("_", " ")}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{entry.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.adminUser?.name ?? "System"} · {entry.entityType} · {fmtWhen(entry.createdAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
