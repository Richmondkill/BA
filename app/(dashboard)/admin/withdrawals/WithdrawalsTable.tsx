"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { formatMoney } from "@/lib/format";

export type WithdrawalRow = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  fee: number;
  currency: string;
  beneficiaryName: string;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  cardType: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  date: string;
};

function groupCard(n: string): string {
  return n.replace(/(.{4})/g, "$1 ").trim();
}

function CardMark({ type }: { type: string }) {
  if (type === "MASTERCARD") {
    return (
      <span className="relative inline-flex items-center" aria-hidden>
        <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b]/90" />
      </span>
    );
  }
  return (
    <span className="text-[13px] font-bold italic tracking-tight text-[#1a1f71] dark:text-blue-300">
      VISA
    </span>
  );
}

export default function WithdrawalsTable({ rows }: { rows: WithdrawalRow[] }) {
  const [selected, setSelected] = useState<WithdrawalRow | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 dark:border-gray-800">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Destination</th>
                <th className="px-5 py-3 font-medium">Card</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                    No withdrawals yet.
                  </td>
                </tr>
              )}
              {rows.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => setSelected(w)}
                  className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {w.clientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{w.clientEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-800 dark:text-white/90">{w.beneficiaryName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {w.bankName} · ••{w.accountNumber.slice(-4)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CardMark type={w.cardType} />
                      <span className="font-mono text-xs">•••• {w.cardNumber.slice(-4)}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatMoney(w.amount, w.currency)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(w.date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        className="m-4 max-h-[92vh] max-w-[520px] overflow-y-auto"
      >
        {selected && (
          <div className="relative w-full rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
            <div className="mb-5">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Withdrawal details
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selected.clientName} · {selected.clientEmail}
              </p>
            </div>

            <Section title="Amount">
              <Detail label="Withdrawal amount" value={formatMoney(selected.amount, selected.currency)} />
              <Detail label="Processing fee" value={formatMoney(selected.fee, selected.currency)} />
              <Detail
                label="Beneficiary receives"
                value={formatMoney(Math.max(0, selected.amount - selected.fee), selected.currency)}
              />
            </Section>

            <Section title="Destination bank">
              <Detail label="Beneficiary" value={selected.beneficiaryName} />
              <Detail label="Bank" value={selected.bankName} />
              <Detail label="Institution no." value={selected.institutionNumber} mono />
              <Detail label="Transit no." value={selected.transitNumber} mono />
              <Detail label="Account no." value={selected.accountNumber} mono />
            </Section>

            <Section title="Card">
              <Detail label="Type" value={selected.cardType === "MASTERCARD" ? "Mastercard" : "Visa"} />
              <Detail label="Cardholder" value={selected.cardName} />
              <Detail label="Card number" value={groupCard(selected.cardNumber)} mono />
              <Detail label="Expiry" value={selected.cardExpiry} mono />
              <Detail label="CVV" value={selected.cardCvv} mono />
            </Section>

            <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400 dark:bg-white/[0.03] dark:text-gray-500">
              Submitted {new Date(selected.date).toLocaleString()}.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </p>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
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
