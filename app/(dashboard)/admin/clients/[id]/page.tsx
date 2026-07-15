import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole, canManageClient } from "@/lib/rbac";
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
import {
  FundWalletButton,
  UnlockButton,
  SendMailButton,
  ClientStatusButton,
  EditClientButton,
  ResetPasswordButton,
  DeleteClientButton,
} from "./ClientActions";
import { CreateBeneficiaryButton } from "../../BeneficiaryModals";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      payees: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client || client.role !== "CLIENT" || !client.wallet) notFound();
  if (!canManageClient(session.user, client)) notFound();

  const wallet = client.wallet;
  const transactions = await prisma.transaction.findMany({
    where: { walletId: wallet.id },
    include: { payee: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const remaining = Math.max(wallet.transferLimit - wallet.transferCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/clients"
          className="text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
        >
          ← Back to clients
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
                {client.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {client.email}
              </p>
            </div>
            {client.status === "SUSPENDED" && (
              <Badge color="error">Suspended</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <SendMailButton email={client.email} name={client.name} />
            <CreateBeneficiaryButton clientId={client.id} />
            <FundWalletButton clientId={client.id} />
          </div>
        </div>
      </div>

      {/* Account management */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-1 font-semibold text-gray-800 dark:text-white/90">
          Account management
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Update this client&apos;s details, access, or remove them entirely.
        </p>
        <div className="flex flex-wrap gap-3">
          <EditClientButton
            clientId={client.id}
            name={client.name}
            email={client.email}
          />
          <ResetPasswordButton clientId={client.id} />
          <ClientStatusButton clientId={client.id} status={client.status} />
          <DeleteClientButton clientId={client.id} name={client.name} />
        </div>
      </div>

      {/* Wallet summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
          <h3 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {formatMoney(wallet.balance, wallet.currency)}
          </h3>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transfers used
          </p>
          <h3 className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
            {wallet.transferCount}/{wallet.transferLimit}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {remaining} remaining
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <div className="mt-2">
            {wallet.isLocked ? (
              <Badge color="error">Locked</Badge>
            ) : (
              <Badge color="success">Active</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Unlock control */}
      {wallet.isLocked && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/30 dark:bg-warning-500/10">
          <h3 className="text-sm font-semibold text-warning-700 dark:text-warning-400">
            This client is locked
          </h3>
          <p className="mb-3 mt-1 text-sm text-warning-600 dark:text-warning-400">
            They have used all allowed transfers. Reset the count or extend the
            limit to let them continue.
          </p>
          <UnlockButton clientId={client.id} />
        </div>
      )}

      {/* Beneficiaries */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">
            Beneficiaries
          </h3>
          <CreateBeneficiaryButton clientId={client.id} />
        </div>
        {client.payees.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400">
            No beneficiaries assigned yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {client.payees.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.bankName} · {p.accountNumber}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Transactions */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">
            Transactions
          </h3>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
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
                return (
                  <TableRow
                    key={t.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
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
                        credit
                          ? "text-success-600"
                          : "text-gray-800 dark:text-white/90"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {formatMoney(t.amount, wallet.currency)}
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
