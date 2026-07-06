import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import BalanceSparkline from "@/components/dashboard/BalanceSparkline";
import CashflowBars from "@/components/dashboard/CashflowBars";
import SpendingBreakdown from "@/components/dashboard/SpendingBreakdown";
import VirtualCard from "@/components/dashboard/VirtualCard";
import MonthlyTarget from "@/components/dashboard/MonthlyTarget";
import QuickSend from "./QuickSend";
import CopyButton from "./CopyButton";
import AccountDetails from "./AccountDetails";
import TransferLauncher from "./TransferLauncher";
import {
  DollarLineIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BoxIconLine,
  PieChartIcon,
} from "@/icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEGMENT_COLORS = ["#ec111a", "#ff5f6b", "#ffc8cd", "#8f1016", "#12b76a", "#e4e7ec"];

function pctChange(cur: number, prev: number): number {
  if (prev <= 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

function Delta({ value, suffix = "than last month" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={up ? "text-success-600" : "text-error-500"}>
        {up ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </span>
      <span className={up ? "text-success-600" : "text-error-500"}>
        {Math.abs(value).toFixed(1)}%
      </span>
      <span className="text-gray-400">{suffix}</span>
    </span>
  );
}

export default async function ClientDashboardPage() {
  const session = await requireRole("CLIENT");

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { include: { payees: { orderBy: { createdAt: "desc" } } } },
      transactions: {
        include: { payee: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!wallet) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No wallet found. Please contact support.
      </p>
    );
  }

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearTx = await prisma.transaction.findMany({
    where: { walletId: wallet.id, status: "COMPLETED", createdAt: { gte: yearStart } },
    select: { type: true, amount: true, createdAt: true, payeeId: true },
  });

  const payees = wallet.user.payees;
  const payeeName = new Map(payees.map((p) => [p.id, p.name]));
  const currency = wallet.currency;
  const balanceNum = wallet.balance.toNumber();
  const last4 = wallet.id.replace(/[^0-9]/g, "").slice(-4).padStart(4, "0");
  // Only block when there's nothing to send to. A locked / over-limit wallet can
  // still *attempt* a transfer: the server logs a BLOCKED audit row and returns
  // the "contact support" message, which the launcher/QuickSend show on the click.
  const disabled = payees.length === 0;

  // Monthly income / expense
  const incomeByMonth = Array(12).fill(0) as number[];
  const expenseByMonth = Array(12).fill(0) as number[];
  const spendByPayee = new Map<string, number>();
  for (const t of yearTx) {
    const m = new Date(t.createdAt).getMonth();
    const amt = t.amount.toNumber();
    if (t.type === "CREDIT") incomeByMonth[m] += amt;
    else {
      expenseByMonth[m] += amt;
      const key = t.payeeId ?? "other";
      spendByPayee.set(key, (spendByPayee.get(key) ?? 0) + amt);
    }
  }

  const now = new Date().getMonth();
  const prev = now - 1;
  const monthIncome = incomeByMonth[now];
  const monthSpent = expenseByMonth[now];
  const prevIncome = prev >= 0 ? incomeByMonth[prev] : 0;
  const prevSpent = prev >= 0 ? expenseByMonth[prev] : 0;
  const yearIncome = incomeByMonth.reduce((a, b) => a + b, 0);
  const yearExpense = expenseByMonth.reduce((a, b) => a + b, 0);
  const savingRate = monthIncome > 0
    ? Math.max(0, Math.min(100, ((monthIncome - monthSpent) / monthIncome) * 100))
    : 0;
  const netThisMonth = monthIncome - monthSpent;
  const netPrevMonth = prevIncome - prevSpent;

  // Sparkline: cumulative net through current month
  let run = 0;
  const spark: number[] = [];
  for (let m = 0; m <= now; m++) {
    run += incomeByMonth[m] - expenseByMonth[m];
    spark.push(Math.round(run));
  }
  if (spark.length < 2) spark.unshift(0);

  // Spending segments (top 6)
  const totalSpend = [...spendByPayee.values()].reduce((a, b) => a + b, 0);
  const segments = [...spendByPayee.entries()]
    .map(([id, value]) => ({
      name: id === "other" ? "Other" : payeeName.get(id) ?? "Unknown",
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Warm, time-aware welcome (not a plain greeting)
  const fullName = session.user.name ?? "there";
  const firstName = fullName.split(" ")[0];
  const hour = new Date().getHours();
  const welcome =
    hour < 5
      ? `Burning the midnight oil, ${firstName}? We've got you.`
      : hour < 12
      ? `A fresh morning, a fresh start, ${firstName}.`
      : hour < 17
      ? `Hope your day is going beautifully, ${firstName}.`
      : hour < 21
      ? `Winding down in style, ${firstName}.`
      : `Rest easy, ${firstName} — your money's in good hands.`;

  // Realistic account details
  const memberSince = wallet.user.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const digits = wallet.id.replace(/\D/g, "").padEnd(18, "0");
  const iban = `GB29 BANK ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  const fullAcct = `•••• •••• •••• ${last4}`;
  const expDate = new Date(wallet.user.createdAt);
  expDate.setFullYear(expDate.getFullYear() + 5);
  const expiry = `${String(expDate.getMonth() + 1).padStart(2, "0")}/${String(
    expDate.getFullYear()
  ).slice(-2)}`;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
          {welcome}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s your money at a glance.
        </p>
      </div>

      {/* ROW 1 — hero + metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hero balance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-white/90">
                Total Balance
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Overview of your current funds
              </p>
            </div>
            <span className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
              {currency}
            </span>
          </div>

          <div className="mt-5">
            <h3 className="text-title-md font-bold text-gray-800 dark:text-white/90">
              {formatMoney(balanceNum, currency)}
            </h3>
            <div className="mt-1">
              <Delta value={pctChange(monthIncome - monthSpent, prevIncome - prevSpent)} />
            </div>
          </div>

          {/* full-width sparkline */}
          <div className="mt-2 -mx-1 h-[70px]">
            <BalanceSparkline data={spark} />
          </div>

          <div className="my-4 border-t border-dashed border-gray-200 dark:border-gray-800" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Primary Account</span>
              <p className="font-medium text-gray-800 dark:text-white/90">{fullAcct}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={fullAcct} />
              <AccountDetails
                holder={fullName}
                accountNumber={fullAcct}
                iban={iban}
                routing="BANKUS33XXX"
                currency={currency}
                balance={formatMoney(balanceNum, currency)}
                status={wallet.isLocked ? "Paused" : "Active"}
                memberSince={memberSince}
                accountType="Premium Wallet"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <TransferLauncher
              payees={payees}
              disabled={disabled}
              currency={currency}
              holder={fullName}
              last4={last4}
              triggerLabel="Transfer"
              triggerClassName="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Link
              href="/client/transactions"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              <ArrowDownIcon />
              Received
            </Link>
          </div>
        </div>

        {/* 2x2 metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <MetricCard
            label="Total Balance"
            value={formatMoney(balanceNum, currency)}
            icon={<BoxIconLine />}
            delta={<Delta value={pctChange(monthIncome - monthSpent, prevIncome - prevSpent)} />}
          />
          <MetricCard
            label="Monthly Income"
            value={formatMoney(monthIncome, currency)}
            icon={<ArrowDownIcon />}
            accent="success"
            delta={<Delta value={pctChange(monthIncome, prevIncome)} />}
          />
          <MetricCard
            label="Total Spent"
            value={formatMoney(monthSpent, currency)}
            icon={<ArrowUpIcon />}
            accent="warning"
            delta={<Delta value={pctChange(monthSpent, prevSpent)} suffix="than last month" />}
          />
          <MetricCard
            label="Saving Rate"
            value={`${savingRate.toFixed(1)}%`}
            icon={<PieChartIcon />}
            accent="info"
            delta={
              <span className="inline-flex items-center gap-2 text-xs text-gray-400">
                <SavingRing pct={savingRate} />
                Goal: 30%
              </span>
            }
          />
        </div>
      </div>

      {/* ROW 2 — cashflow + cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white/90">
                Cashflow Overview
              </h3>
              <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                {formatMoney(yearIncome, currency)}
              </p>
              <span className="text-xs text-gray-400">Total received this year</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-200" /> Expense
              </span>
            </div>
          </div>
          <CashflowBars categories={MONTHS} income={incomeByMonth} expense={expenseByMonth} />
        </div>

        {/* My cards + recent */}
        <div className="space-y-4">
          <VirtualCard
            holder={fullName}
            last4={last4}
            expiry={expiry}
            status={wallet.isLocked ? "Paused" : "Active"}
          />

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
              Recent Transactions
            </h3>
            <ul className="space-y-3.5">
              {wallet.transactions.slice(0, 5).map((t) => {
                const credit = t.type === "CREDIT";
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          credit ? "bg-success-500/10 text-success-600" : "bg-brand-500/10 text-brand-500"
                        }`}
                      >
                        <DollarLineIcon />
                      </span>
                      <span className="min-w-0 truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t.payee ? t.payee.name : t.description ?? (credit ? "Funding" : "Transfer")}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        credit ? "text-success-600" : "text-gray-800 dark:text-white/90"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {formatMoney(t.amount, currency)}
                    </span>
                  </li>
                );
              })}
              {wallet.transactions.length === 0 && (
                <li className="text-xs text-gray-400">No transactions yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ROW 3 — spending + quick send + this month */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Spending */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">Spending</h3>
            <span className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              This year
            </span>
          </div>
          {totalSpend > 0 ? (
            <>
              <SpendingBreakdown
                labels={segments.map((s) => s.name)}
                series={segments.map((s) => s.value)}
              />
              <ul className="mt-4 space-y-2.5">
                {segments.map((s, i) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {formatMoney(s.value, currency)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round((s.value / totalSpend) * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex h-[240px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <PieChartIcon />
              </div>
              <p className="mt-3 text-sm text-gray-400">No spending yet.</p>
            </div>
          )}
        </div>

        {/* Quick send */}
        <QuickSend payees={payees} disabled={disabled} currency={currency} last4={last4} />

        {/* Monthly target (savings goal) */}
        <MonthlyTarget
          title="Monthly Target"
          subtitle="Your savings goal for this month"
          percent={savingRate}
          delta={pctChange(monthIncome - monthSpent, prevIncome - prevSpent)}
          message={
            netThisMonth >= netPrevMonth
              ? `You kept ${formatMoney(netThisMonth, currency)} this month — higher than last month. Keep it up!`
              : `You kept ${formatMoney(netThisMonth, currency)} this month. A little more gets you to goal.`
          }
          footer={[
            { label: "Target", value: "30%", up: false },
            { label: "Received", value: formatMoney(monthIncome, currency), up: true },
            { label: "Sent", value: formatMoney(monthSpent, currency), up: monthSpent <= prevSpent },
          ]}
        />
      </div>

      {/* ROW 4 — transactions table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">Recent Transactions</h3>
          <Link href="/client/transactions" className="text-sm text-brand-500 hover:text-brand-600">
            See all
          </Link>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 dark:border-gray-800">
                <th className="px-6 py-3 font-medium">Reference</th>
                <th className="px-6 py-3 font-medium">Activity</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {wallet.transactions.map((t) => {
                const credit = t.type === "CREDIT";
                return (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      #{t.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {t.payee ? t.payee.name : t.description ?? (credit ? "Funding" : "Transfer")}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${credit ? "text-success-600" : "text-gray-800 dark:text-white/90"}`}>
                      {credit ? "+" : "−"}
                      {formatMoney(t.amount, currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {t.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {t.status === "BLOCKED" ? (
                        <span className="rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-400">
                          Paused
                        </span>
                      ) : (
                        <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---- inline server sub-components ---- */

function MetricCard({
  label,
  value,
  icon,
  delta,
  accent = "brand",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: React.ReactNode;
  accent?: "brand" | "success" | "warning" | "info";
}) {
  const chip: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
    info: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${chip[accent]}`}>
          {icon}
        </span>
      </div>
      <h4 className="mt-3 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h4>
      {delta && <div className="mt-2">{delta}</div>}
    </div>
  );
}

function SavingRing({ pct }: { pct: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke="#ec111a"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
      />
    </svg>
  );
}
