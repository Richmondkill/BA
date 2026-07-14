// Shared wallet-debit logic used by the client-initiated money-out flows
// (saved-beneficiary transfer, external wire/EFT transfer and withdrawal).
//
// The 4-transfer lifetime limit lives here:
//  - If the wallet is locked or has already used its allowance, we log a
//    BLOCKED transaction (in its own committed write so the audit row sticks),
//    lock the wallet, and return the "contact support" message.
//  - Otherwise we debit atomically and bump the count, locking on the last one.
//
// This is a plain server-only module (not "use server"): it is imported by the
// server actions, so `revalidatePath` runs inside a request as required.

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CONTACT_SUPPORT_MESSAGE, type ActionResult } from "@/lib/action-result";

class DebitError extends Error {}

export type DebitWalletInput = {
  clientId: string;
  amount: Prisma.Decimal;
  description?: string;
  /** When set, the beneficiary must belong to the client (saved-payee path). */
  payeeId?: string | null;
};

export async function debitWallet({
  clientId,
  amount,
  description,
  payeeId = null,
}: DebitWalletInput): Promise<ActionResult> {
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
          payeeId,
          description,
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
      if (!w) throw new DebitError("Wallet not found.");
      // Re-check under the transaction to guard against races.
      if (w.isLocked || w.transferCount >= w.transferLimit) {
        throw new DebitError(CONTACT_SUPPORT_MESSAGE);
      }

      if (payeeId) {
        const payee = await tx.payee.findFirst({ where: { id: payeeId, clientId } });
        if (!payee) throw new DebitError("Beneficiary not found or not assigned to you.");
      }

      if (amount.greaterThan(w.balance)) {
        throw new DebitError("Insufficient balance.");
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
          payeeId,
          description,
          createdById: clientId,
        },
      });
    });
  } catch (e) {
    if (e instanceof DebitError) return { ok: false, error: e.message };
    throw e;
  }

  revalidatePath("/client");
  revalidatePath("/client/transactions");
  return { ok: true };
}
