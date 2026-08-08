import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentTopbar } from "@/components/agent/agent-topbar";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already enforces portal === "agent" for every /agent/* route.
  const session = await auth();
  const settings = await prisma.orgSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AgentTopbar
        company={session?.user?.company ?? "Agency Dashboard"}
        name={session?.user?.name ?? "Agent"}
        logoUrl={session?.user?.logoUrl}
        showBrowse={settings?.allowAgentBrowse ?? false}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  );
}
