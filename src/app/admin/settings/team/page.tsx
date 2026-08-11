import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { AdminUserDialog, EditAdminUserTrigger } from "./admin-user-dialog";
import { DeleteAdminUserButton } from "./delete-admin-user-button";

export default async function TeamSettingsPage() {
  const session = await auth();
  const isOwner = session?.user?.adminRole === "OWNER";

  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  if (!isOwner) {
    return (
      <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-purple/10 text-purple">
          <Users className="size-6" />
        </div>
        <p>Only owners can manage team accounts.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AdminUserDialog />
      </div>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-row items-center gap-3 p-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{u.name}</p>
                <Badge
                  variant="outline"
                  className={
                    u.role === "OWNER"
                      ? "border-purple/25 bg-purple/10 text-xs text-purple"
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
              trigger={<EditAdminUserTrigger />}
            />
            <DeleteAdminUserButton userId={u.id} name={u.name} />
          </Card>
        ))}
      </div>
    </div>
  );
}
