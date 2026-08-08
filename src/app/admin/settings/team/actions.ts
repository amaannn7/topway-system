"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-session";
import { logAudit } from "@/lib/audit";
import { adminUserFormSchema } from "@/lib/validations/admin-user";

export async function createAdminUser(raw: unknown) {
  const owner = await requireOwner();
  const values = adminUserFormSchema.parse(raw);
  if (!values.password) throw new Error("Password is required for a new account");

  const existing = await prisma.adminUser.findUnique({ where: { email: values.email } });
  if (existing) throw new Error("That email is already in use");

  const passwordHash = await bcrypt.hash(values.password, 10);
  const created = await prisma.adminUser.create({
    data: {
      name: values.name,
      email: values.email,
      passwordHash,
      role: values.role,
      active: values.active,
    },
  });

  await logAudit({
    adminUserId: owner.id,
    action: "CREATE",
    entityType: "AdminUser",
    entityId: created.id,
    summary: `Created staff account for ${created.name} (${created.role})`,
  });

  revalidatePath("/admin/settings/team");
}

export async function updateAdminUser(userId: string, raw: unknown) {
  const owner = await requireOwner();
  const values = adminUserFormSchema.parse(raw);

  const existing = await prisma.adminUser.findUnique({ where: { email: values.email } });
  if (existing && existing.id !== userId) throw new Error("That email is already in use");

  // Guard against locking everyone out: can't demote/deactivate the last
  // active owner (including yourself), since there'd be no one left who
  // can manage team accounts at all.
  if (values.role !== "OWNER" || !values.active) {
    const target = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (target?.role === "OWNER" && target.active) {
      const otherActiveOwners = await prisma.adminUser.count({
        where: { role: "OWNER", active: true, id: { not: userId } },
      });
      if (otherActiveOwners === 0) {
        throw new Error("At least one active owner is required");
      }
    }
  }

  const data: {
    name: string;
    email: string;
    role: "OWNER" | "STAFF";
    active: boolean;
    passwordHash?: string;
  } = {
    name: values.name,
    email: values.email,
    role: values.role,
    active: values.active,
  };
  if (values.password) data.passwordHash = await bcrypt.hash(values.password, 10);

  await prisma.adminUser.update({ where: { id: userId }, data });

  await logAudit({
    adminUserId: owner.id,
    action: "UPDATE",
    entityType: "AdminUser",
    entityId: userId,
    summary: `Updated staff account for ${values.name}`,
  });

  revalidatePath("/admin/settings/team");
}

export async function deleteAdminUser(userId: string) {
  const owner = await requireOwner();
  if (userId === owner.id) throw new Error("You cannot delete your own account");

  const target = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Account not found");

  if (target.role === "OWNER") {
    const otherActiveOwners = await prisma.adminUser.count({
      where: { role: "OWNER", active: true, id: { not: userId } },
    });
    if (otherActiveOwners === 0) throw new Error("At least one active owner is required");
  }

  await prisma.adminUser.delete({ where: { id: userId } });

  await logAudit({
    adminUserId: owner.id,
    action: "DELETE",
    entityType: "AdminUser",
    entityId: userId,
    summary: `Deleted staff account for ${target.name}`,
  });

  revalidatePath("/admin/settings/team");
}
