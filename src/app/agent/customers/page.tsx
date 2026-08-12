import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users2, Share2 } from "lucide-react";
import { CustomerDialog } from "./customer-dialog";
import { DeleteCustomerButton } from "./delete-customer-button";

export default async function AgentCustomersPage() {
  const session = await auth();
  const agentId = session!.user.id;

  const customers = await prisma.customer.findMany({
    where: { agentId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { shares: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 ring-1 ring-primary/10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/10">
            <Users2 className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Give your own sponsors/employers view-only access to candidates you share with them.
            </p>
          </div>
        </div>
        <div className="self-start sm:self-auto">
          <CustomerDialog triggerClassName="rounded-full px-4 shadow-sm" />
        </div>
      </div>

      {customers.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users2 className="size-6" />
          </div>
          <p>No customer accounts yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {customers.map((c) => (
            <Card
              key={c.id}
              className="flex flex-row items-center gap-3 overflow-hidden border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary shadow-sm ring-1 ring-primary/10">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.companyName && (
                    <span className="truncate text-xs text-muted-foreground">{c.companyName}</span>
                  )}
                  {!c.active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">@{c.username}</span>
                  {" · "}
                  {c._count.shares} profile{c._count.shares === 1 ? "" : "s"} shared
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/agent/customers/${c.id}`} />}
              >
                <Share2 className="size-3.5" />
                Manage sharing
              </Button>
              <CustomerDialog
                customerId={c.id}
                defaultValues={{
                  name: c.name,
                  companyName: c.companyName ?? "",
                  username: c.username,
                  password: "",
                  active: c.active,
                }}
                triggerVariant="ghost"
                triggerSize="icon"
                triggerIconOnly
                triggerAriaLabel="Edit customer"
              />
              <DeleteCustomerButton customerId={c.id} name={c.name} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
