import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrowsePool } from "@/lib/agent-applicant-view";
import { BrowseCard } from "./browse-card";
import { Search } from "lucide-react";

export default async function AgentBrowsePage() {
  const settings = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.allowAgentBrowse) redirect("/agent/dashboard");

  const session = await auth();
  const pool = await getBrowsePool(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/10">
          <Search className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse &amp; request</h1>
          <p className="text-sm text-muted-foreground">
            Profiles not yet assigned to your agency. Request one and admin will review it.
          </p>
        </div>
      </div>

      {pool.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          <Search className="size-8 opacity-40" />
          <p>No profiles available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pool.map((a) => (
            <BrowseCard key={a.id} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}
