import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { AdminUserDialog } from "./admin-user-dialog";
import { DeleteAdminUserButton } from "./delete-admin-user-button";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function TeamSettingsPage() {
  const session = await auth();
  const isOwner = session?.user?.adminRole === "OWNER";

  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  if (!isOwner) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="size-6" />
        </div>
        <p>Only owners can manage team accounts.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AdminUserDialog triggerClassName="rounded-full px-4 shadow-sm" />
      </div>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <Card
            key={u.id}
            className="flex flex-row items-center gap-3 p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <Avatar className="size-9 shrink-0 shadow-sm ring-2 ring-background">
              <AvatarFallback
                className={
                  u.role === "OWNER"
                    ? "bg-gradient-to-br from-primary to-primary/70 text-xs font-medium text-primary-foreground"
                    : "bg-gradient-to-br from-primary to-secondary text-xs font-medium text-primary-foreground"
                }
              >
                {initials(u.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{u.name}</p>
                <Badge
                  variant="outline"
                  className={
                    u.role === "OWNER"
                      ? "border-primary/25 bg-primary/10 text-xs text-primary"
                      : "text-xs"
                  }
                >
                  {u.role === "OWNER" ? "Owner" : "Staff"}
                </Badge>
                {!u.active && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Inactive
                  </Badge>
                )}
                {u.id === session?.user?.id && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <AdminUserDialog
              userId={u.id}
              defaultValues={{
                name: u.name,
                email: u.email,
                password: "",
                role: u.role,
                active: u.active,
                canViewPayments: u.canViewPayments,
              }}
              triggerVariant="ghost"
              triggerSize="icon"
              triggerIconOnly
              triggerAriaLabel="Edit account"
            />
            <DeleteAdminUserButton userId={u.id} name={u.name} />
          </Card>
        ))}
      </div>
    </div>
  );
}
