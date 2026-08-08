import { auth } from "@/lib/auth";
import { getAgentApplicants } from "@/lib/agent-applicant-view";
import { ApplicantsView } from "./applicants-view";

export default async function AgentApplicantsPage() {
  const session = await auth();
  const applicants = await getAgentApplicants(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My applicants</h1>
        <p className="text-sm text-muted-foreground">
          {applicants.length} applicant{applicants.length === 1 ? "" : "s"} assigned to your
          agency.
        </p>
      </div>

      <ApplicantsView applicants={applicants} />
    </div>
  );
}
