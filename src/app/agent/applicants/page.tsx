import { auth } from "@/lib/auth";
import { getAgentApplicants } from "@/lib/agent-applicant-view";
import { ApplicantCard } from "./applicant-card";
import { ApplicantsToolbar } from "./applicants-toolbar";
import { Users } from "lucide-react";

export default async function AgentApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await auth();
  const { q, status } = await searchParams;

  const applicants = await getAgentApplicants(session!.user.id);
  const filtered = applicants.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && a.status !== status) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My applicants</h1>
        <p className="text-sm text-muted-foreground">
          {applicants.length} applicant{applicants.length === 1 ? "" : "s"} assigned to your
          agency.
        </p>
      </div>

      <ApplicantsToolbar />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <Users className="size-8 opacity-40" />
          <p>
            {applicants.length === 0
              ? "No applicants assigned yet."
              : "No applicants match the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => (
            <ApplicantCard key={a.id} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}
