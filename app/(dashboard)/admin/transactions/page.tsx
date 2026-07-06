import Link from "next/link";
import { requireRole, clientScopeWhere } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

export default async function AdminTransactionsPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  const scope = clientScopeWhere(session.user);

  const transactions = await prisma.transaction.findMany({
    where: { wallet: { user: scope } },
    include: {
      payee: true,
      wallet: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
        Transactions
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Latest {transactions.length} transactions across your clients.
      </p>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Client
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Type
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Details
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Date
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((t) => {
                const credit = t.type === "CREDIT";
                const client = t.wallet.user;
                return (
                  <TableRow
                    key={t.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <TableCell className="px-5 py-4">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {t.status === "BLOCKED" ? (
                        <Badge color="warning">Blocked</Badge>
                      ) : credit ? (
                        <Badge color="success">Funded</Badge>
                      ) : (
                        <Badge color="light">Transfer</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {t.payee ? t.payee.name : t.description ?? "—"}
                    </TableCell>
                    <TableCell
                      className={`px-5 py-4 text-sm font-medium ${
                        credit ? "text-success-600" : "text-gray-800 dark:text-white/90"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {formatMoney(t.amount)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {t.createdAt.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
