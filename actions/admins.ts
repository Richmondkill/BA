"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  createAdminSchema,
  updateAdminSchema,
  resetAdminPasswordSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/action-result";

/** Load an ADMIN target, ensuring the caller is the super admin. */
async function requireAdminTarget(id: string) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "ADMIN") return null;
  return target;
}

/** Only the super admin can create other admins. */
export async function createAdmin(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("SUPER_ADMIN");

  const parsed = createAdminSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { ok: false, error: "That email is already in use." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "ADMIN",
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/admins");
  return { ok: true };
}

/** Edit an admin's name, email and active/suspended status. */
export async function updateAdmin(formData: FormData): Promise<ActionResult> {
  await requireRole("SUPER_ADMIN");

  const parsed = updateAdminSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const target = await requireAdminTarget(parsed.data.id);
  if (!target) return { ok: false, error: "Admin not found." };

  if (parsed.data.email !== target.email) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing && existing.id !== target.id) {
      return { ok: false, error: "That email is already in use." };
    }
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/admins");
  return { ok: true };
}

/** Reset an admin's password. */
export async function resetAdminPassword(formData: FormData): Promise<ActionResult> {
  await requireRole("SUPER_ADMIN");

  const parsed = resetAdminPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const target = await requireAdminTarget(parsed.data.id);
  if (!target) return { ok: false, error: "Admin not found." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash },
  });

  revalidatePath("/admin/admins");
  return { ok: true };
}

/**
 * Delete an admin. Their clients are not deleted — the createdBy relation is
 * optional, so those clients become unassigned and remain visible to the
 * super admin.
 */
export async function deleteAdmin(formData: FormData): Promise<ActionResult> {
  await requireRole("SUPER_ADMIN");

  const id = String(formData.get("id") ?? "");
  const target = await requireAdminTarget(id);
  if (!target) return { ok: false, error: "Admin not found." };

  await prisma.user.delete({ where: { id: target.id } });

  revalidatePath("/admin/admins");
  return { ok: true };
}
