import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewPayments } from "@/lib/require-session";
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
  // pending-request count, not a second authorization check. The
  // canViewPayments check IS load-bearing though — it hides the Invoices
  // nav item for staff without payment access (the actual page-level
  // authorization lives in each invoices route/action, this is just the
  // nav not advertising a section they'd be bounced out of).
  const session = await auth();
  const pendingRequestCount = await prisma.agentRequest.count({
    where: { status: "PENDING" },
  });

  return (
    <SidebarProvider>
      <AdminSidebar
        pendingRequestCount={pendingRequestCount}
        canViewPayments={!!session?.user && canViewPayments(session.user)}
      />
      <SidebarInset>
        <AdminTopbar
          name={session?.user?.name ?? "Admin"}
          role={session?.user?.adminRole ?? "STAFF"}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-[1680px]">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
