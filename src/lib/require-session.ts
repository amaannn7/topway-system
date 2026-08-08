import { auth } from "@/lib/auth";

// Server actions aren't covered by proxy.ts's route matcher (that only
// intercepts page navigations), so every mutating action re-checks the
// session itself rather than trusting that the calling page was gated.
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.portal !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireAgent() {
  const session = await auth();
  if (session?.user?.portal !== "agent") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// Team account management (add/edit/remove other admins) is OWNER-only —
// replaces the legacy's single shared admin password with real per-user
// accounts and a role that actually restricts sensitive actions.
export async function requireOwner() {
  const user = await requireAdmin();
  if (user.adminRole !== "OWNER") {
    throw new Error("Only owners can manage team accounts");
  }
  return user;
}
