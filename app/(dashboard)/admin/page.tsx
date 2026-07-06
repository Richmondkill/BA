import Link from "next/link";
import { requireRole, clientScopeWhere } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import StatCard from "@/components/dashboard/StatCard";
import CashflowChart from "@/components/dashboard/CashflowChart";
import Badge from "@/components/ui/badge/Badge";
import {
  GroupIcon,
  DollarLineIcon,
  PaperPlaneIcon,
  UserCircleIcon,
} from "@/icons";

export default async function AdminOverviewPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  const actor = session.user;
  const scope = clientScopeWhere(actor);

  const [clientCount, funded, spent, adminCount, recentClients, recentTx] =
    await Promise.all([
      prisma.user.count({ where: scope }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "CREDIT", status: "COMPLETED", wallet: { user: scope } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "DEBIT", status: "COMPLETED", wallet: { user: scope } },
      }),
      actor.role === "SUPER_ADMIN"
        ? prisma.user.count({ where: { role: "ADMIN" } })
        : Promise.resolve(0),
      prisma.user.findMany({
        where: scope,
        include: { wallet: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: { wallet: { user: scope } },
        include: {
          payee: true,
          wallet: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  // Build a 7-day cashflow series (funded vs transferred).
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);
  const chartTx = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED",
      wallet: { user: scope },
      createdAt: { gte: since },
    },
    select: { type: true, amount: true, createdAt: true },
  });

  const dayLabels: string[] = [];
  const fundedByDay: number[] = [];
  const transferredByDay: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    dayLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    fundedByDay.push(0);
    transferredByDay.push(0);
  }
  for (const t of chartTx) {
    const idx = Math.floor(
      (new Date(t.createdAt).setHours(0, 0, 0, 0) - since.getTime()) / 86400000
    );
    if (idx < 0 || idx > 6) continue;
    const amt = t.amount.toNumber();
    if (t.type === "CREDIT") fundedByDay[idx] += amt;
    else transferredByDay[idx] += amt;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
          Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {actor.role === "SUPER_ADMIN"
            ? "System-wide summary across all admins and clients."
            : "Summary of the clients you manage."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clients"
          value={String(clientCount)}
          icon={<GroupIcon />}
          accent="brand"
          hint="People you manage"
        />
        <StatCard
          label="Total Funded"
          value={formatMoney(funded._sum.amount ?? 0)}
          icon={<DollarLineIcon />}
          accent="success"
          hint="Credited to wallets"
        />
        <StatCard
          label="Total Transferred"
          value={formatMoney(spent._sum.amount ?? 0)}
          icon={<PaperPlaneIcon />}
          accent="info"
          hint="Sent by clients"
        />
        {actor.role === "SUPER_ADMIN" ? (
          <StatCard
            label="Admins"
            value={String(adminCount)}
            icon={<UserCircleIcon />}
            accent="warning"
            hint="Team members"
          />
        ) : (
          <StatCard
            label="Net Float"
            value={formatMoney(
              (funded._sum.amount?.toNumber() ?? 0) -
                (spent._sum.amount?.toNumber() ?? 0)
            )}
            icon={<DollarLineIcon />}
            accent="warning"
            hint="Funded minus transferred"
          />
        )}
      </div>

      {/* Cashflow */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              Cashflow
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Funded vs transferred · last 7 days
            </p>
          </div>
        </div>
        <CashflowChart
          categories={dayLabels}
          funded={fundedByDay}
          transferred={transferredByDay}
        />
      </div>

      {/* Recent clients + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              Recent clients
            </h3>
            <Link
              href="/admin/clients"
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No clients yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentClients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {c.email}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-800 dark:text-white/90">
                      {c.wallet ? formatMoney(c.wallet.balance) : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              Recent activity
            </h3>
            <Link
              href="/admin/transactions"
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No transactions yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentTx.map((t) => {
                const credit = t.type === "CREDIT";
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          t.status === "BLOCKED"
                            ? "bg-warning-500/10 text-warning-600"
                            : credit
                            ? "bg-success-500/10 text-success-600"
                            : "bg-brand-500/10 text-brand-500"
                        }`}
                      >
                        {credit ? <DollarLineIcon /> : <PaperPlaneIcon />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {t.wallet.user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {t.payee ? t.payee.name : t.description ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          credit
                            ? "text-success-600"
                            : "text-gray-800 dark:text-white/90"
                        }`}
                      >
                        {credit ? "+" : "−"}
                        {formatMoney(t.amount)}
                      </p>
                      {t.status === "BLOCKED" && (
                        <Badge color="warning" size="sm">
                          Blocked
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
