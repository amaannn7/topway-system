import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already enforces portal === "admin" for every /admin/* route;
  // this session read is just for display (name, role) and the live
  // pending-request count, not a second authorization check.
  const session = await auth();
  const pendingRequestCount = await prisma.agentRequest.count({
    where: { status: "PENDING" },
  });

  return (
    <SidebarProvider>
      <AdminSidebar pendingRequestCount={pendingRequestCount} />
      <SidebarInset>
        <AdminTopbar
          name={session?.user?.name ?? "Admin"}
          role={session?.user?.adminRole ?? "STAFF"}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
