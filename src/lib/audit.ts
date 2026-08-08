import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Nothing in the legacy system recorded who changed a pipeline step,
// confirmed a candidate, or deleted a profile (Phase 1 §6/§9). Every admin
// mutation should call this so /admin/settings/audit-log has something
// real to show.
export async function logAudit(entry: {
  adminUserId: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "LOGIN";
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({ data: entry });
}
