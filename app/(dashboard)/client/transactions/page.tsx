import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import TransactionsTable, { type TxRow } from "./TransactionsTable";

export default async function ClientTransactionsPage() {
  const session = await requireRole("CLIENT");

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  });

  const transactions = wallet
    ? await prisma.transaction.findMany({
        where: { walletId: wallet.id },
        include: { payee: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  const currency = wallet?.currency ?? "USD";
  const holder = session.user.name ?? "";
  const last4 = wallet
    ? wallet.id.replace(/[^0-9]/g, "").slice(-4).padStart(4, "0")
    : "0000";

  const rows: TxRow[] = transactions.map((t) => ({
    id: t.id,
    reference: `#${t.id.slice(-6).toUpperCase()}`,
    type: t.type,
    status: t.status,
    amount: t.amount.toNumber(),
    balanceAfter: t.balanceAfter.toNumber(),
    description: t.description,
    payee: t.payee
      ? {
          name: t.payee.name,
          bankName: t.payee.bankName,
          accountNumber: t.payee.accountNumber,
        }
      : null,
    date: t.createdAt.toISOString(),
    currency,
  }));

  return (
    <div>
      <h1 className="mb-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
        Transactions
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Your funding and transfer history. Click a row for details.
      </p>
      <TransactionsTable rows={rows} holder={holder} last4={last4} />
    </div>
  );
}
