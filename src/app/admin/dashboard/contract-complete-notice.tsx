"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { PartyPopper } from "lucide-react";
import { markContractCompleteNotified } from "./actions";

// Fires a one-time toast for applicants who just crossed the 2-year
// contract-complete mark (deriveLifecycleStatus, computed server-side on
// the dashboard page). A ref guards against React StrictMode's double-
// invoke in dev firing this twice; the real once-ever guarantee is
// contractCompleteNotifiedAt on the applicant row, stamped after the toast
// shows.
export function ContractCompleteNotice({
  applicants,
}: {
  applicants: { id: string; name: string }[];
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || applicants.length === 0) return;
    fired.current = true;

    const names = applicants.map((a) => a.name || "(Unnamed)");
    const summary =
      names.length === 1
        ? `${names[0]} has completed their 2-year contract.`
        : `${names.length} candidates have completed their 2-year contract: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ", …" : ""}.`;

    toast(summary, {
      icon: <PartyPopper className="size-4" />,
      duration: 8000,
    });

    markContractCompleteNotified(applicants.map((a) => a.id));
  }, [applicants]);

  return null;
}
