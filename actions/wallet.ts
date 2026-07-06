"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, canManageClient } from "@/lib/rbac";
import { fundWalletSchema, unlockSchema } from "@/lib/validation";
import { parseAmount } from "@/lib/money";
import type { ActionResult } from "@/lib/action-result";

/** Admin funds a client's wallet (mints simulated money). */
export async function fundWallet(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = fundWalletSchema.safeParse({
    clientId: formData.get("clientId"),
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let amount: Prisma.Decimal;
  try {
    amount = parseAmount(parsed.data.amount);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const client = await prisma.user.findUnique({
    where: { id: parsed.data.clientId },
    include: { wallet: true },
  });
  if (!client || client.role !== "CLIENT" || !client.wallet) {
    return { ok: false, error: "Client not found." };
  }
  if (!canManageClient(session.user, client)) {
    return { ok: false, error: "You do not manage this client." };
  }

  const newBalance = new Prisma.Decimal(client.wallet.balance).plus(amount);
  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: client.wallet.id },
      data: { balance: newBalance },
    }),
    prisma.transaction.create({
      data: {
        walletId: client.wallet.id,
        type: "CREDIT",
        status: "COMPLETED",
        amount,
        balanceAfter: newBalance,
        description: parsed.data.description ?? "Wallet funded",
        createdById: session.user.id,
      },
    }),
  ]);

  revalidatePath(`/admin/clients/${client.id}`);
  revalidatePath("/admin/clients");
  return { ok: true };
}

/** Admin unlocks a client that hit the transfer limit. */
export async function unlockClient(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = unlockSchema.safeParse({
    clientId: formData.get("clientId"),
    mode: formData.get("mode"),
    by: formData.get("by") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const client = await prisma.user.findUnique({
    where: { id: parsed.data.clientId },
    include: { wallet: true },
  });
  if (!client || client.role !== "CLIENT" || !client.wallet) {
    return { ok: false, error: "Client not found." };
  }
  if (!canManageClient(session.user, client)) {
    return { ok: false, error: "You do not manage this client." };
  }

  const data =
    parsed.data.mode === "reset"
      ? { transferCount: 0, isLocked: false }
      : {
          transferLimit: client.wallet.transferLimit + parsed.data.by,
          isLocked: false,
        };

  await prisma.wallet.update({ where: { id: client.wallet.id }, data });

  revalidatePath(`/admin/clients/${client.id}`);
  return { ok: true };
}
