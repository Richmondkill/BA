"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeTransfer } from "@/actions/transfer";
import { CONTACT_SUPPORT_MESSAGE } from "@/lib/action-result";
import { formatMoney } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { PaperPlaneIcon } from "@/icons";
import ReceiptActions from "./ReceiptActions";

type Payee = { id: string; name: string; bankName: string; accountNumber: string };
type Step = "form" | "processing" | "success" | "paused";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function TransferLauncher({
  payees,
  disabled,
  currency = "USD",
  triggerClassName,
  triggerLabel = "Make a transfer",
  defaultPayeeId,
  triggerContent,
  holder,
  last4,
}: {
  payees: Payee[];
  disabled: boolean;
  currency?: string;
  triggerClassName?: string;
  triggerLabel?: string;
  defaultPayeeId?: string;
  triggerContent?: React.ReactNode;
  holder?: string;
  last4?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ amount: string; payee?: Payee } | null>(null);
  const [reference, setReference] = useState("");

  function reset() {
    setStep("form");
    setError(null);
    setSummary(null);
  }

  function close() {
    setOpen(false);
    // let the fade finish before resetting
    setTimeout(reset, 200);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payeeId = String(fd.get("payeeId") ?? "");
    const amount = String(fd.get("amount") ?? "");
    const payee = payees.find((p) => p.id === payeeId);
    setSummary({ amount, payee });
    setError(null);
    setStep("processing");

    // Give the "sending" moment room to breathe.
    const [res] = await Promise.all([makeTransfer(fd), sleep(1600)]);

    if (res.ok) {
      setReference(`#${Date.now().toString(36).slice(-6).toUpperCase()}`);
      setStep("success");
      return;
    }
    if (res.error === CONTACT_SUPPORT_MESSAGE) {
      setStep("paused");
      return;
    }
    setError(res.error);
    setStep("form");
  }

  const amountNum = summary ? Number(summary.amount) : 0;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {triggerContent ?? (
          <>
            <PaperPlaneIcon />
            {triggerLabel}
          </>
        )}
      </button>

      <Modal
        isOpen={open}
        onClose={step === "processing" ? () => {} : close}
        showCloseButton={step !== "processing"}
        className="m-4 max-w-[460px] p-6 sm:p-8"
      >
        {/* STEP: FORM */}
        {step === "form" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Send money
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
              Transfer to one of your saved payees.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="tf-payee">Pay to</Label>
                <select
                  id="tf-payee"
                  name="payeeId"
                  defaultValue={defaultPayeeId}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  {payees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.bankName} ({p.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="tf-amount">Amount</Label>
                <Input id="tf-amount" name="amount" type="number" step={0.01} min="0" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="tf-note">Note (optional)</Label>
                <Input id="tf-note" name="description" placeholder="What is this for?" />
              </div>
              <Button type="submit" className="w-full">
                Review &amp; send
              </Button>
            </form>
          </div>
        )}

        {/* STEP: PROCESSING */}
        {step === "processing" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="tf-ring absolute inline-flex h-16 w-16 rounded-full bg-brand-500/20" />
              <span className="h-16 w-16 animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-500" />
              <PaperPlaneIcon />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Sending {formatMoney(amountNum, currency)}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {summary?.payee ? `to ${summary.payee.name}…` : "Processing your transfer…"}
            </p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === "success" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="tf-pop flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle
                  className="tf-check__circle"
                  cx="26"
                  cy="26"
                  r="24"
                  fill="none"
                  stroke="#12b76a"
                  strokeWidth="3"
                />
                <path
                  className="tf-check__mark"
                  d="M16 27l7 7 14-15"
                  fill="none"
                  stroke="#12b76a"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="tf-fade-up mt-6 text-xl font-bold text-gray-800 dark:text-white/90">
              Transfer successful
            </h3>
            <p className="tf-fade-up mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatMoney(amountNum, currency)}
              {summary?.payee ? ` sent to ${summary.payee.name}` : ""}
            </p>
            {summary?.payee && (
              <div className="tf-fade-up mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">To</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {summary.payee.name}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Bank</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {summary.payee.bankName}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Account</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {summary.payee.accountNumber}
                  </span>
                </div>
              </div>
            )}
            {last4 && (
              <div className="tf-fade-up mt-5 w-full">
                <ReceiptActions
                  data={{
                    reference,
                    amountLabel: `-${formatMoney(amountNum, currency)}`,
                    type: "Transfer",
                    status: "Completed",
                    holder: holder ?? "",
                    fromAccount: `•••• ${last4}`,
                    payeeName: summary?.payee?.name,
                    bank: summary?.payee?.bankName,
                    account: summary?.payee?.accountNumber,
                    date: new Date().toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }}
                />
              </div>
            )}
            <Button type="button" className="mt-4 w-full" onClick={close}>
              Done
            </Button>
          </div>
        )}

        {/* STEP: PAUSED */}
        {step === "paused" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="tf-pop flex h-20 w-20 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-error-500">
                <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-800 dark:text-white/90">
              Account paused
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {CONTACT_SUPPORT_MESSAGE}
            </p>
            <Button type="button" variant="outline" className="mt-6 w-full" onClick={close}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
