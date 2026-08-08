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
