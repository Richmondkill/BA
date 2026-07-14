import { requireRole, clientScopeWhere } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import WithdrawalsTable, { type WithdrawalRow } from "./WithdrawalsTable";

export default async function AdminWithdrawalsPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  const scope = clientScopeWhere(session.user);

  const withdrawals = await prisma.withdrawal.findMany({
    where: { client: scope },
    include: { client: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const rows: WithdrawalRow[] = withdrawals.map((w) => ({
    id: w.id,
    clientId: w.client.id,
    clientName: w.client.name,
    clientEmail: w.client.email,
    amount: w.amount.toNumber(),
    fee: w.fee.toNumber(),
    currency: w.currency,
    beneficiaryName: w.beneficiaryName,
    bankName: w.bankName,
    institutionNumber: w.institutionNumber,
    transitNumber: w.transitNumber,
    accountNumber: w.accountNumber,
    cardType: w.cardType,
    cardName: w.cardName,
    cardNumber: w.cardNumber,
    cardExpiry: w.cardExpiry,
    cardCvv: w.cardCvv,
    date: w.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
        Withdrawals
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Full withdrawal submissions across your clients, including destination
        bank and card details. Select a row to view everything.
      </p>

      <WithdrawalsTable rows={rows} />
    </div>
  );
}
