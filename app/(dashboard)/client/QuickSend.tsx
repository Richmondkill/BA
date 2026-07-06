"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeTransfer } from "@/actions/transfer";
import { CONTACT_SUPPORT_MESSAGE } from "@/lib/action-result";
import { formatMoney } from "@/lib/format";

type Payee = { id: string; name: string; bankName: string; accountNumber: string };
type Status = "idle" | "processing" | "success" | "error" | "paused";

const AVATAR_TINTS = [
  "bg-brand-500/10 text-brand-500",
  "bg-success-500/10 text-success-600",
  "bg-warning-500/10 text-warning-600",
  "bg-blue-light-500/10 text-blue-light-600",
  "bg-theme-purple-500/10 text-theme-purple-500",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function QuickSend({
  payees,
  disabled,
  currency = "USD",
  last4,
}: {
  payees: Payee[];
  disabled: boolean;
  currency?: string;
  last4: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(payees[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Button stays active while the account is usable; we validate on click so
  // an empty amount shows guidance instead of a dead-looking button.
  const blocked = disabled || status === "processing";

  async function send() {
    if (blocked) return;
    if (!selected) {
      setStatus("error");
      setMessage("Choose a payee to send to.");
      return;
    }
    if (!(Number(amount) > 0)) {
      setStatus("error");
      setMessage("Enter an amount to send.");
      return;
    }
    setStatus("processing");
    setMessage(null);
    const fd = new FormData();
    fd.set("payeeId", selected);
    fd.set("amount", amount);
    const payee = payees.find((p) => p.id === selected);
    const [res] = await Promise.all([makeTransfer(fd), sleep(1300)]);
    if (res.ok) {
      setStatus("success");
      setMessage(
        `${formatMoney(Number(amount), currency)} sent to ${payee?.name ?? "payee"}`
      );
      setAmount("");
      router.refresh();
      return;
    }
    if (res.error === CONTACT_SUPPORT_MESSAGE) {
      setStatus("paused");
      setMessage(CONTACT_SUPPORT_MESSAGE);
      router.refresh();
      return;
    }
    setStatus("error");
    setMessage(res.error);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
        Quick send
      </h3>

      {payees.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No payees yet — your admin will add them.
        </p>
      ) : (
        <>
          {disabled && status !== "success" && (
            <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
              Transfers are paused on this account. Please contact support to
              restore access.
            </div>
          )}
          {/* Avatars */}
          <div className="mb-5 flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {payees.map((p, i) => {
              const active = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  title={p.name}
                  className="flex shrink-0 flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                      AVATAR_TINTS[i % AVATAR_TINTS.length]
                    } ${active ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900" : ""}`}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="w-12 truncate text-center text-[11px] text-gray-500 dark:text-gray-400">
                    {p.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Send From */}
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Send from
          </label>
          <div className="mb-4 flex h-11 items-center rounded-lg border border-gray-300 px-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
            Wallet •••• {last4}
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Currency
              </label>
              <div className="flex h-11 items-center rounded-lg border border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
                $ {currency}
              </div>
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={disabled}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          {message && (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                status === "success"
                  ? "border border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
                  : "border border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
              }`}
            >
              {status === "success" ? `✓ ${message}` : message}
            </div>
          )}

          <button
            type="button"
            onClick={send}
            disabled={blocked}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "processing" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending…
              </>
            ) : (
              "Send Money"
            )}
          </button>
        </>
      )}
    </div>
  );
}
