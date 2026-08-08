import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.portal === "admin") redirect("/admin/dashboard");
  if (session?.user?.portal === "agent") redirect("/agent/dashboard");
  redirect("/login");
}
