import { Lock } from "lucide-react";

// Shown instead of a real amount/bank-detail value when the signed-in
// staff account doesn't have canViewPayments (see require-session.ts).
// A redacted placeholder rather than hiding the row entirely, so staff
// without access still know the figure exists.
export function MaskedAmount({ className }: { className?: string }) {
  return (
    <span className={className}>
      <Lock className="inline size-3 -translate-y-px text-muted-foreground/70" /> Restricted
    </span>
  );
}
