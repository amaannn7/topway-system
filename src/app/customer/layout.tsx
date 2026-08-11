import { auth } from "@/lib/auth";
import { CustomerTopbar } from "@/components/customer/customer-topbar";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already enforces portal === "customer" for every /customer/* route.
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <CustomerTopbar
        company={session?.user?.company ?? "Recruitment Agency"}
        name={session?.user?.name ?? "Customer"}
        logoUrl={session?.user?.logoUrl}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  );
}
