"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageClient } from "@/lib/rbac";
import { createPayeeSchema, assignPayeeSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/action-result";

/**
 * Admin creates a beneficiary. If a clientId is supplied it is assigned to that
 * client; otherwise it is left unassigned for the admin to hand to a client
 * later via `assignPayee`.
 */
export async function createPayee(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const rawClientId = formData.get("clientId");
  const parsed = createPayeeSchema.safeParse({
    clientId: rawClientId ? String(rawClientId) : undefined,
    name: formData.get("name"),
    bankName: formData.get("bankName"),
    institutionNumber: formData.get("institutionNumber"),
    transitNumber: formData.get("transitNumber"),
    accountNumber: formData.get("accountNumber"),
    swift: formData.get("swift") || undefined,
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // If assigning on creation, verify the admin manages that client.
  let clientId: string | null = null;
  if (parsed.data.clientId) {
    const client = await prisma.user.findUnique({
      where: { id: parsed.data.clientId },
    });
    if (!client || client.role !== "CLIENT") {
      return { ok: false, error: "Client not found." };
    }
    if (!canManageClient(session.user, client)) {
      return { ok: false, error: "You do not manage this client." };
    }
    clientId = client.id;
  }

  await prisma.payee.create({
    data: {
      name: parsed.data.name,
      bankName: parsed.data.bankName,
      institutionNumber: parsed.data.institutionNumber,
      transitNumber: parsed.data.transitNumber,
      accountNumber: parsed.data.accountNumber,
      swift: parsed.data.swift || null,
      address: parsed.data.address || null,
      clientId,
      createdById: session.user.id,
    },
  });

  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/beneficiaries");
  return { ok: true };
}

/** Admin assigns an existing (typically unassigned) beneficiary to a client. */
export async function assignPayee(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = assignPayeeSchema.safeParse({
    payeeId: formData.get("payeeId"),
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const payee = await prisma.payee.findUnique({ where: { id: parsed.data.payeeId } });
  if (!payee) return { ok: false, error: "Beneficiary not found." };
  // A plain admin may only touch beneficiaries they created or that already
  // belong to a client they manage.
  if (session.user.role !== "SUPER_ADMIN" && payee.createdById !== session.user.id) {
    if (payee.clientId) {
      const owner = await prisma.user.findUnique({ where: { id: payee.clientId } });
      if (!owner || !canManageClient(session.user, owner)) {
        return { ok: false, error: "You cannot manage this beneficiary." };
      }
    } else {
      return { ok: false, error: "You cannot manage this beneficiary." };
    }
  }

  const client = await prisma.user.findUnique({ where: { id: parsed.data.clientId } });
  if (!client || client.role !== "CLIENT") {
    return { ok: false, error: "Client not found." };
  }
  if (!canManageClient(session.user, client)) {
    return { ok: false, error: "You do not manage this client." };
  }

  await prisma.payee.update({
    where: { id: payee.id },
    data: { clientId: client.id },
  });

  revalidatePath("/admin/beneficiaries");
  revalidatePath(`/admin/clients/${client.id}`);
  return { ok: true };
}
