"use server";

import { auth, signOut } from "@/lib/auth";

export async function signOutAction() {
  const session = await auth();
  const portal = session?.user?.portal;
  const redirectTo =
    portal === "agent" ? "/login/agent" : portal === "customer" ? "/login/customer" : "/login";
  await signOut({ redirectTo });
}
