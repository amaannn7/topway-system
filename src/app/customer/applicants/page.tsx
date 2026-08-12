import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCustomerApplicants } from "@/lib/agent-applicant-view";
import { ApplicantsView } from "./applicants-view";

export default async function CustomerApplicantsPage() {
  const session = await auth();
  const applicants = await getCustomerApplicants(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/10">
          <Users className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidate profiles</h1>
          <p className="text-sm text-muted-foreground">
            {applicants.length} profile{applicants.length === 1 ? "" : "s"} shared with you.
          </p>
        </div>
      </div>

      <ApplicantsView applicants={applicants} />
    </div>
  );
}
