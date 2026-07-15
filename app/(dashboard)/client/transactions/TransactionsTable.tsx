"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { formatMoney } from "@/lib/format";
import ReceiptActions from "../ReceiptActions";

export type TxRow = {
  id: string;
  reference: string;
  type: "CREDIT" | "DEBIT";
  status: "COMPLETED" | "BLOCKED";
  amount: number;
  balanceAfter: number;
  description: string | null;
  payee: { name: string; bankName: string; accountNumber: string } | null;
  date: string;
  currency: string;
};

function StatusBadge({ status }: { status: TxRow["status"] }) {
  if (status === "BLOCKED")
    return (
      <span className="rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-400">
        Pending
      </span>
    );
  return (
    <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
      Completed
    </span>
  );
}

export default function TransactionsTable({
  rows,
  holder,
  last4,
}: {
  rows: TxRow[];
  holder: string;
  last4: string;
}) {
  const [selected, setSelected] = useState<TxRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {rows.map((t) => {
                const credit = t.type === "CREDIT";
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {t.reference}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {t.payee ? t.payee.name : t.description ?? (credit ? "Funding" : "Transfer")}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${credit ? "text-success-600" : "text-gray-800 dark:text-white/90"}`}>
                      {credit ? "+" : "−"}
                      {formatMoney(t.amount, t.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(t.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        className="m-4 max-w-[460px]"
      >
        {selected && (
          <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
            <div className="flex flex-col items-center text-center">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  selected.status === "BLOCKED"
                    ? "bg-warning-500/10 text-warning-600"
                    : selected.type === "CREDIT"
                    ? "bg-success-500/10 text-success-600"
                    : "bg-brand-500/10 text-brand-500"
                }`}
              >
                {selected.type === "CREDIT" ? "↓" : "↑"}
              </span>
              <p
                className={`mt-4 text-2xl font-bold ${
                  selected.type === "CREDIT" ? "text-success-600" : "text-gray-800 dark:text-white/90"
                }`}
              >
                {selected.type === "CREDIT" ? "+" : "−"}
                {formatMoney(selected.amount, selected.currency)}
              </p>
              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
              <Detail label="Reference" value={selected.reference} mono />
              <Detail
                label="Type"
                value={selected.type === "CREDIT" ? "Funding" : "Transfer"}
              />
              {selected.payee && (
                <>
                  <Detail label="To" value={selected.payee.name} />
                  <Detail label="Bank" value={selected.payee.bankName} />
                  <Detail label="Account" value={selected.payee.accountNumber} />
                </>
              )}
              <Detail
                label="Date"
                value={new Date(selected.date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              {selected.status === "COMPLETED" && (
                <Detail
                  label="Balance after"
                  value={formatMoney(selected.balanceAfter, selected.currency)}
                />
              )}
              {selected.description && (
                <Detail label="Note" value={selected.description} />
              )}
            </div>

            <div className="mt-5">
              <ReceiptActions
                data={{
                  reference: selected.reference,
                  amountLabel: `${selected.type === "CREDIT" ? "+" : "-"}${formatMoney(
                    selected.amount,
                    selected.currency
                  )}`,
                  type: selected.type === "CREDIT" ? "Funding" : "Transfer",
                  status: selected.status === "BLOCKED" ? "Pending" : "Completed",
                  holder,
                  fromAccount: `•••• ${last4}`,
                  payeeName: selected.payee?.name,
                  bank: selected.payee?.bankName,
                  account: selected.payee?.accountNumber,
                  balanceAfter:
                    selected.status === "COMPLETED"
                      ? formatMoney(selected.balanceAfter, selected.currency)
                      : undefined,
                  date: new Date(selected.date).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-right text-sm font-medium text-gray-800 dark:text-white/90 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
