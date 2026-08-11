"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { customerFormSchema } from "@/lib/validations/customer";

export async function createCustomer(raw: unknown) {
  const agent = await requireAgent();
  const values = customerFormSchema.parse(raw);
  if (!values.password) throw new Error("Password is required for a new customer account");

  const existing = await prisma.customer.findUnique({ where: { username: values.username } });
  if (existing) throw new Error("That username is already taken");

  const passwordHash = await bcrypt.hash(values.password, 10);
  const customer = await prisma.customer.create({
    data: {
      agentId: agent.id,
      name: values.name,
      companyName: values.companyName || null,
      username: values.username,
      passwordHash,
      active: values.active,
    },
  });

  await logAudit({
    adminUserId: null,
    action: "CREATE",
    entityType: "Customer",
    entityId: customer.id,
    summary: `Agent created customer account "${customer.name}" (agentId: ${agent.id})`,
  });

  revalidatePath("/agent/customers");
}

export async function updateCustomer(customerId: string, raw: unknown) {
  const agent = await requireAgent();
  const values = customerFormSchema.parse(raw);

  const target = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!target || target.agentId !== agent.id) throw new Error("Customer not found");

  const existing = await prisma.customer.findUnique({ where: { username: values.username } });
  if (existing && existing.id !== customerId) throw new Error("That username is already taken");

  const data: {
    name: string;
    companyName: string | null;
    username: string;
    active: boolean;
    passwordHash?: string;
  } = {
    name: values.name,
    companyName: values.companyName || null,
    username: values.username,
    active: values.active,
  };
  if (values.password) data.passwordHash = await bcrypt.hash(values.password, 10);

  await prisma.customer.update({ where: { id: customerId }, data });

  await logAudit({
    adminUserId: null,
    action: "UPDATE",
    entityType: "Customer",
    entityId: customerId,
    summary: `Agent updated customer account "${values.name}" (agentId: ${agent.id})`,
  });

  revalidatePath("/agent/customers");
}

export async function deleteCustomer(customerId: string) {
  const agent = await requireAgent();
  const target = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!target || target.agentId !== agent.id) throw new Error("Customer not found");

  await prisma.customer.delete({ where: { id: customerId } });

  await logAudit({
    adminUserId: null,
    action: "DELETE",
    entityType: "Customer",
    entityId: customerId,
    summary: `Agent deleted customer account "${target.name}" (agentId: ${agent.id})`,
  });

  revalidatePath("/agent/customers");
}

// Sets the full share list for a customer in one call — same replace-all
// semantics as setAgentAssignments (admin/agents/actions.ts), scoped so an
// agent can only share applicants actually assigned to them.
export async function setCustomerShares(customerId: string, applicantIds: string[]) {
  const agent = await requireAgent();
  const target = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!target || target.agentId !== agent.id) throw new Error("Customer not found");

  const assigned = await prisma.agentAssignment.findMany({
    where: { agentId: agent.id, applicantId: { in: applicantIds } },
    select: { applicantId: true },
  });
  const allowedIds = new Set(assigned.map((a) => a.applicantId));
  const safeIds = applicantIds.filter((id) => allowedIds.has(id));

  await prisma.$transaction([
    prisma.customerShare.deleteMany({ where: { customerId } }),
    ...(safeIds.length
      ? [
          prisma.customerShare.createMany({
            data: safeIds.map((applicantId) => ({ customerId, applicantId })),
          }),
        ]
      : []),
  ]);

  await logAudit({
    adminUserId: null,
    action: "UPDATE",
    entityType: "Customer",
    entityId: customerId,
    summary: `Agent set shared profiles for customer (${safeIds.length} shared, agentId: ${agent.id})`,
  });

  revalidatePath("/agent/customers");
  revalidatePath(`/agent/customers/${customerId}`);
}
