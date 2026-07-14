"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageClient } from "@/lib/rbac";
import { createPayeeSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/action-result";

/** Admin creates a payee and assigns it to one of their clients. */
export async function createPayee(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createPayeeSchema.safeParse({
    clientId: formData.get("clientId"),
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

  const client = await prisma.user.findUnique({
    where: { id: parsed.data.clientId },
  });
  if (!client || client.role !== "CLIENT") {
    return { ok: false, error: "Client not found." };
  }
  if (!canManageClient(session.user, client)) {
    return { ok: false, error: "You do not manage this client." };
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
      clientId: client.id,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/admin/clients/${client.id}`);
  return { ok: true };
}
