"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { transferSchema } from "@/lib/validation";
import { parseAmount } from "@/lib/money";
import { CONTACT_SUPPORT_MESSAGE, type ActionResult } from "@/lib/action-result";

class TransferError extends Error {}

/**
 * Client-initiated transfer to an assigned payee.
 *
 * The 4-transfer lifetime limit lives here:
 *  - If the wallet is locked or has already used its allowance, we log a
 *    BLOCKED transaction (in its own committed write so the audit row sticks),
 *    lock the wallet, and return the "contact support" message.
 *  - Otherwise we debit atomically and bump the count, locking on the last one.
 */
export async function makeTransfer(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("CLIENT");
  const clientId = session.user.id;

  const parsed = transferSchema.safeParse({
    payeeId: formData.get("payeeId"),
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

  const wallet = await prisma.wallet.findUnique({ where: { userId: clientId } });
  if (!wallet) return { ok: false, error: "Wallet not found." };

  // --- Limit gate (blocked path, logged in its own committed transaction) ---
  if (wallet.isLocked || wallet.transferCount >= wallet.transferLimit) {
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { isLocked: true },
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          status: "BLOCKED",
          amount,
          balanceAfter: wallet.balance,
          payeeId: parsed.data.payeeId,
          description: parsed.data.description,
          createdById: clientId,
        },
      }),
    ]);
    revalidatePath("/client");
    return { ok: false, error: CONTACT_SUPPORT_MESSAGE };
  }

  // --- Happy path (atomic debit) ---
  try {
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!w) throw new TransferError("Wallet not found.");
      // Re-check under the transaction to guard against races.
      if (w.isLocked || w.transferCount >= w.transferLimit) {
        throw new TransferError(CONTACT_SUPPORT_MESSAGE);
      }

      const payee = await tx.payee.findFirst({
        where: { id: parsed.data.payeeId, clientId },
      });
      if (!payee) throw new TransferError("Payee not found or not assigned to you.");

      if (amount.greaterThan(w.balance)) {
        throw new TransferError("Insufficient balance.");
      }

      const newBalance = new Prisma.Decimal(w.balance).minus(amount);
      const newCount = w.transferCount + 1;

      await tx.wallet.update({
        where: { id: w.id },
        data: {
          balance: newBalance,
          transferCount: newCount,
          isLocked: newCount >= w.transferLimit,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: w.id,
          type: "DEBIT",
          status: "COMPLETED",
          amount,
          balanceAfter: newBalance,
          payeeId: payee.id,
          description: parsed.data.description,
          createdById: clientId,
        },
      });
    });
  } catch (e) {
    if (e instanceof TransferError) return { ok: false, error: e.message };
    throw e;
  }

  revalidatePath("/client");
  revalidatePath("/client/transactions");
  return { ok: true };
}
