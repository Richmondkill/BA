"use server";

import { Prisma } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageClient } from "@/lib/rbac";
import {
  createClientSchema,
  setClientStatusSchema,
  updateClientSchema,
  resetClientPasswordSchema,
  deleteClientSchema,
} from "@/lib/validation";
import { parseAmount } from "@/lib/money";
import type { ActionResult } from "@/lib/action-result";

/** Load a CLIENT the caller is allowed to manage, or return an error result. */
async function loadManagedClient(
  actor: { id: string; role: "SUPER_ADMIN" | "ADMIN" | "CLIENT" },
  clientId: string
) {
  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client || client.role !== "CLIENT") {
    return { ok: false as const, error: "Client not found." };
  }
  if (!canManageClient(actor, client)) {
    return { ok: false as const, error: "You do not manage this client." };
  }
  return { ok: true as const, client };
}

/** Admin (or super admin) creates a client + wallet, optionally pre-funded. */
export async function createClient(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    initialBalance: formData.get("initialBalance") ?? 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { ok: false, error: "That email is already in use." };

  let initial = new Prisma.Decimal(0);
  if (parsed.data.initialBalance > 0) {
    try {
      initial = parseAmount(parsed.data.initialBalance);
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "CLIENT",
      createdById: session.user.id,
      wallet: {
        create: {
          balance: initial,
          transactions: initial.greaterThan(0)
            ? {
                create: {
                  type: "CREDIT",
                  status: "COMPLETED",
                  amount: initial,
                  balanceAfter: initial,
                  description: "Initial funding",
                  createdById: session.user.id,
                },
              }
            : undefined,
        },
      },
    },
  });

  revalidatePath("/admin/clients");
  return { ok: true };
}

/** Suspend or reactivate a client. Suspended clients cannot sign in. */
export async function setClientStatus(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = setClientStatusSchema.safeParse({
    clientId: formData.get("clientId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const found = await loadManagedClient(session.user, parsed.data.clientId);
  if (!found.ok) return { ok: false, error: found.error };

  await prisma.user.update({
    where: { id: found.client.id },
    data: { status: parsed.data.status },
  });

  revalidatePath(`/admin/clients/${found.client.id}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}

/** Edit a client's name and email. */
export async function updateClient(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = updateClientSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const found = await loadManagedClient(session.user, parsed.data.clientId);
  if (!found.ok) return { ok: false, error: found.error };

  // Guard against colliding with another user's email.
  const emailOwner = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (emailOwner && emailOwner.id !== found.client.id) {
    return { ok: false, error: "That email is already in use." };
  }

  await prisma.user.update({
    where: { id: found.client.id },
    data: { name: parsed.data.name, email: parsed.data.email },
  });

  revalidatePath(`/admin/clients/${found.client.id}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}

/** Reset a client's password to a new value. */
export async function resetClientPassword(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = resetClientPasswordSchema.safeParse({
    clientId: formData.get("clientId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const found = await loadManagedClient(session.user, parsed.data.clientId);
  if (!found.ok) return { ok: false, error: found.error };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { id: found.client.id },
    data: { passwordHash },
  });

  return { ok: true };
}

/** Permanently delete a client (wallet, transactions, payees, requests cascade). */
export async function deleteClient(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = deleteClientSchema.safeParse({
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const found = await loadManagedClient(session.user, parsed.data.clientId);
  if (!found.ok) return { ok: false, error: found.error };

  try {
    await prisma.user.delete({ where: { id: found.client.id } });
  } catch {
    return {
      ok: false,
      error: "Could not delete this client. Try suspending them instead.",
    };
  }

  revalidatePath("/admin/clients");
  return { ok: true };
}
