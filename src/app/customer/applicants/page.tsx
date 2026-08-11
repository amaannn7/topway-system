import { auth } from "@/lib/auth";
import { getCustomerApplicants } from "@/lib/agent-applicant-view";
import { ApplicantsView } from "./applicants-view";

export default async function CustomerApplicantsPage() {
  const session = await auth();
  const applicants = await getCustomerApplicants(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidate profiles</h1>
        <p className="text-sm text-muted-foreground">
          {applicants.length} profile{applicants.length === 1 ? "" : "s"} shared with you.
        </p>
      </div>

      <ApplicantsView applicants={applicants} />
    </div>
  );
}
