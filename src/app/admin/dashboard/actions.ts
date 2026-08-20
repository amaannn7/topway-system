"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-session";

// Stamps the one-time "contract completed" pop-up as shown for these
// applicants so the dashboard doesn't re-fire it on the next page load.
// Called from the client after the toast has actually rendered, not before
// - if the request fails partway, the applicant just gets notified again
// next visit, which is the safe failure mode (a repeat is harmless; a
// silently-swallowed notification is not).
export async function markContractCompleteNotified(applicantIds: string[]) {
  await requireAdmin();
  if (applicantIds.length === 0) return;

  await prisma.applicant.updateMany({
    where: { id: { in: applicantIds } },
    data: { contractCompleteNotifiedAt: new Date() },
  });
}
