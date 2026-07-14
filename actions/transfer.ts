"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { transferSchema, externalTransferSchema } from "@/lib/validation";
import { parseAmount } from "@/lib/money";
import { debitWallet } from "@/lib/wallet-debit";
import {
  CONTACT_SUPPORT_MESSAGE,
  NOT_A_BENEFICIARY_MESSAGE,
  type ActionResult,
} from "@/lib/action-result";

const TRANSFER_TYPE_LABEL: Record<string, string> = {
  DOMESTIC_WIRE: "Domestic wire",
  INTERNATIONAL_WIRE: "International wire",
  EFT: "EFT",
};

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

/**
 * External transfer to a Canadian account (domestic wire, international wire,
 * or EFT) with manually entered banking details. Shares the wallet-debit and
 * transfer-limit logic with the saved-beneficiary path; the recipient's details
 * are recorded on the transaction description (no saved Payee row is created).
 */
export async function makeExternalTransfer(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole("CLIENT");
  const clientId = session.user.id;

  const parsed = externalTransferSchema.safeParse({
    transferType: formData.get("transferType"),
    recipientName: formData.get("recipientName"),
    recipientAddress: formData.get("recipientAddress") || undefined,
    bankName: formData.get("bankName"),
    institutionNumber: formData.get("institutionNumber"),
    transitNumber: formData.get("transitNumber"),
    accountNumber: formData.get("accountNumber"),
    swift: formData.get("swift") || undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency") || undefined,
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

  // Beneficiary gate: a client may only transfer to accounts they have on file.
  // Match by account number against the client's saved beneficiaries.
  const target = parsed.data.accountNumber.trim();
  const beneficiaries = await prisma.payee.findMany({ where: { clientId } });
  const beneficiary = beneficiaries.find((b) => b.accountNumber.trim() === target);
  if (!beneficiary) {
    return { ok: false, error: NOT_A_BENEFICIARY_MESSAGE };
  }

  const label = TRANSFER_TYPE_LABEL[parsed.data.transferType] ?? "Transfer";
  const reference = parsed.data.description?.trim();
  const description = `${beneficiary.name} · ${label}${
    reference ? ` — ${reference}` : ""
  }`;

  return debitWallet({ clientId, amount, description, payeeId: beneficiary.id });
}
