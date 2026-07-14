"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeExternalTransfer } from "@/actions/transfer";
import {
  CONTACT_SUPPORT_MESSAGE,
  NOT_A_BENEFICIARY_MESSAGE,
} from "@/lib/action-result";
import { formatMoney } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { PaperPlaneIcon } from "@/icons";
import ReceiptActions from "./ReceiptActions";

type Beneficiary = {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  institutionNumber?: string | null;
  transitNumber?: string | null;
  swift?: string | null;
  address?: string | null;
};
type TransferType = "DOMESTIC_WIRE" | "INTERNATIONAL_WIRE" | "EFT";
type Step = "type" | "details" | "processing" | "success" | "suspended" | "blocked";

type Prefill = {
  recipientName?: string;
  bankName?: string;
  accountNumber?: string;
  institutionNumber?: string;
  transitNumber?: string;
  swift?: string;
  address?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TYPE_META: Record<
  TransferType,
  { title: string; blurb: string; badge: string; icon: React.ReactNode }
> = {
  DOMESTIC_WIRE: {
    title: "Domestic Wire Transfer",
    blurb: "Send to a bank account within Canada.",
    badge: "Same-day within Canada",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  INTERNATIONAL_WIRE: {
    title: "International Wire Transfer",
    blurb: "Send from abroad to a Canadian account (SWIFT/BIC).",
    badge: "1–3 business days",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  EFT: {
    title: "Electronic Funds Transfer (EFT)",
    blurb: "Deposit directly to a Canadian bank account.",
    badge: "Low cost · 1–2 business days",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
};

export default function TransferLauncher({
  beneficiaries,
  disabled,
  currency = "CAD",
  triggerClassName,
  triggerLabel = "Make a transfer",
  triggerContent,
  holder,
  last4,
  prefill,
}: {
  beneficiaries: Beneficiary[];
  disabled?: boolean;
  currency?: string;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerContent?: React.ReactNode;
  holder?: string;
  last4?: string;
  prefill?: Prefill;
}) {
  const router = useRouter();
  const initialBen = prefill
    ? beneficiaries.find((b) => b.accountNumber.trim() === prefill.accountNumber?.trim())
    : undefined;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(prefill ? "details" : "type");
  const [type, setType] = useState<TransferType>("EFT");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  // Recipient identity fields are controlled so the beneficiary picker can
  // auto-fill them; everything else stays uncontrolled and read via FormData.
  const [selectedBenId, setSelectedBenId] = useState(initialBen?.id ?? "");
  const [recipientName, setRecipientName] = useState(prefill?.recipientName ?? "");
  const [bankName, setBankName] = useState(prefill?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(prefill?.accountNumber ?? "");
  const [institutionNumber, setInstitutionNumber] = useState(prefill?.institutionNumber ?? "");
  const [transitNumber, setTransitNumber] = useState(prefill?.transitNumber ?? "");
  const [swift, setSwift] = useState(prefill?.swift ?? "");
  const [address, setAddress] = useState(prefill?.address ?? "");

  const [summary, setSummary] = useState<{
    amount: number;
    recipientName: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    label: string;
  } | null>(null);

  function reset() {
    setStep(prefill ? "details" : "type");
    setType("EFT");
    setError(null);
    setSummary(null);
    setSelectedBenId(initialBen?.id ?? "");
    setRecipientName(prefill?.recipientName ?? "");
    setBankName(prefill?.bankName ?? "");
    setAccountNumber(prefill?.accountNumber ?? "");
    setInstitutionNumber(prefill?.institutionNumber ?? "");
    setTransitNumber(prefill?.transitNumber ?? "");
    setSwift(prefill?.swift ?? "");
    setAddress(prefill?.address ?? "");
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
    router.refresh();
  }

  function chooseType(t: TransferType) {
    setType(t);
    setError(null);
    setStep("details");
  }

  function pickBeneficiary(id: string) {
    setSelectedBenId(id);
    const b = beneficiaries.find((x) => x.id === id);
    if (b) {
      setRecipientName(b.name);
      setBankName(b.bankName);
      setAccountNumber(b.accountNumber);
      setInstitutionNumber(b.institutionNumber ?? "");
      setTransitNumber(b.transitNumber ?? "");
      setSwift(b.swift ?? "");
      setAddress(b.address ?? "");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("transferType", type);
    fd.set("currency", String(fd.get("currency") ?? currency));

    // Beneficiary gate (client-side pre-check; the server enforces it too).
    const target = accountNumber.trim();
    const match = beneficiaries.find((b) => b.accountNumber.trim() === target);
    if (!match) {
      setError(null);
      setStep("blocked");
      return;
    }

    setSummary({
      amount: Number(fd.get("amount") ?? 0),
      recipientName: match.name,
      bankName: match.bankName,
      accountNumber: match.accountNumber,
      currency: String(fd.get("currency") ?? currency),
      label: TYPE_META[type].title,
    });
    setError(null);
    setStep("processing");

    const [res] = await Promise.all([makeExternalTransfer(fd), sleep(1700)]);

    if (res.ok) {
      setReference(`#${Date.now().toString(36).slice(-6).toUpperCase()}`);
      setStep("success");
      return;
    }
    if (res.error === CONTACT_SUPPORT_MESSAGE) {
      setStep("suspended");
      return;
    }
    if (res.error === NOT_A_BENEFICIARY_MESSAGE) {
      setStep("blocked");
      return;
    }
    setError(res.error);
    setStep("details");
  }

  const meta = TYPE_META[type];
  const maskedAccount = summary ? `••${summary.accountNumber.slice(-4)}` : "";
  const hasBeneficiaries = beneficiaries.length > 0;

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
        className="m-4 max-h-[92vh] max-w-[520px] overflow-y-auto p-6 sm:p-7"
      >
        {/* STEP: CHOOSE TYPE */}
        {step === "type" && (
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/10">1</span>
              Choose transfer type
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              How would you like to send money?
            </h3>
            <p className="mb-5 mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select the method that matches your recipient&apos;s bank.
            </p>
            <div className="space-y-3">
              {(Object.keys(TYPE_META) as TransferType[]).map((t) => {
                const m = TYPE_META[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => chooseType(t)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {m.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                        {m.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        {m.blurb}
                      </span>
                      <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {m.badge}
                      </span>
                    </span>
                    <span className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <LockGlyph /> Bank-grade encryption
            </p>
          </div>
        )}

        {/* STEP: DETAILS */}
        {step === "details" && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              {!prefill && (
                <button
                  type="button"
                  onClick={() => setStep("type")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06]"
                  aria-label="Back"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {meta.icon}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
                  {meta.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send to one of your saved beneficiaries
                </p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </div>
              )}

              {/* Beneficiary picker */}
              <div>
                <FieldLabel>Beneficiary</FieldLabel>
                <select
                  value={selectedBenId}
                  onChange={(e) => pickBeneficiary(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat px-4 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                  }}
                >
                  <option value="" disabled>
                    {hasBeneficiaries ? "Select a beneficiary…" : "No beneficiaries on file"}
                  </option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.bankName} ({b.accountNumber})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <LockGlyph /> You can only transfer to your saved beneficiaries.
                </p>
              </div>

              <Field
                label="Recipient's full name"
                name="recipientName"
                placeholder="e.g. Jordan A. Bell"
                value={recipientName}
                onChange={setRecipientName}
                required
              />

              {type !== "EFT" && (
                <Field
                  label="Recipient's address"
                  name="recipientAddress"
                  placeholder="Street, city, province, postal code"
                  value={address}
                  onChange={setAddress}
                  optional
                />
              )}

              <Field
                label="Bank name"
                name="bankName"
                placeholder="e.g. Scotiabank"
                value={bankName}
                onChange={setBankName}
                required
              />

              {type === "INTERNATIONAL_WIRE" && (
                <Field
                  label="SWIFT / BIC"
                  name="swift"
                  placeholder="e.g. NOSCCATT"
                  hint="8 or 11 characters"
                  value={swift}
                  onChange={setSwift}
                  uppercase
                  required
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Institution no."
                  name="institutionNumber"
                  placeholder="002"
                  hint="3 digits"
                  value={institutionNumber}
                  onChange={setInstitutionNumber}
                  inputMode="numeric"
                  maxLength={3}
                  required
                />
                <Field
                  label="Branch / transit no."
                  name="transitNumber"
                  placeholder="00152"
                  hint="5 digits"
                  value={transitNumber}
                  onChange={setTransitNumber}
                  inputMode="numeric"
                  maxLength={5}
                  required
                />
              </div>

              <Field
                label="Account number"
                name="accountNumber"
                placeholder="Select a beneficiary above"
                value={accountNumber}
                onChange={(v) => {
                  setAccountNumber(v);
                  setSelectedBenId("");
                }}
                maxLength={34}
                required
              />

              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <Field
                  label="Amount"
                  name="amount"
                  type="number"
                  step={0.01}
                  min="0"
                  placeholder="0.00"
                  required
                />
                <div>
                  <FieldLabel>Currency</FieldLabel>
                  <select
                    name="currency"
                    defaultValue={currency}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <Field
                label="Payment reference / description"
                name="description"
                placeholder="e.g. Invoice #1042"
                optional
              />

              <Button type="submit" className="w-full">
                Review &amp; send
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <LockGlyph /> Your details are encrypted in transit
              </p>
            </form>
          </div>
        )}

        {/* STEP: PROCESSING */}
        {step === "processing" && summary && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="tf-ring absolute inline-flex h-16 w-16 rounded-full bg-brand-500/20" />
              <span className="h-16 w-16 animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-500" />
              <PaperPlaneIcon />
            </div>
            <h3 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Sending {formatMoney(summary.amount, summary.currency)}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              to {summary.recipientName} · {summary.label}…
            </p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === "success" && summary && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="tf-pop flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle className="tf-check__circle" cx="26" cy="26" r="24" fill="none" stroke="#12b76a" strokeWidth="3" />
                <path className="tf-check__mark" d="M16 27l7 7 14-15" fill="none" stroke="#12b76a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="tf-fade-up mt-6 text-xl font-bold text-gray-800 dark:text-white/90">
              Transfer submitted
            </h3>
            <p className="tf-fade-up mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatMoney(summary.amount, summary.currency)} to {summary.recipientName}
            </p>

            <div className="tf-fade-up mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left dark:border-gray-800 dark:bg-white/[0.03]">
              <Row label="Reference" value={reference} mono />
              <Row label="Method" value={summary.label} />
              <Row label="Bank" value={summary.bankName} />
              <Row label="Account" value={maskedAccount} />
            </div>

            {last4 && (
              <div className="tf-fade-up mt-5 w-full">
                <ReceiptActions
                  data={{
                    reference,
                    amountLabel: `-${formatMoney(summary.amount, summary.currency)}`,
                    type: "Transfer",
                    status: "Completed",
                    holder: holder ?? "",
                    fromAccount: `•••• ${last4}`,
                    payeeName: summary.recipientName,
                    bank: summary.bankName,
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

        {/* STEP: BLOCKED — recipient is not a saved beneficiary */}
        {step === "blocked" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="tf-pop flex h-20 w-20 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-500/15">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-warning-600 dark:text-warning-400">
                <path d="M12 3l8 4v5c0 4.4-3.1 7.9-8 9-4.9-1.1-8-4.6-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M12 8v4M12 15.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-800 dark:text-white/90">
              Recipient not in your beneficiaries
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {NOT_A_BENEFICIARY_MESSAGE}
            </p>
            <div className="mt-6 flex w-full gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={close}>
                Close
              </Button>
              <Button type="button" className="flex-1" onClick={() => setStep("details")}>
                Back to transfer
              </Button>
            </div>
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

/* ---- small presentational helpers ---- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      {children}
    </label>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  value,
  onChange,
  hint,
  type = "text",
  step,
  min,
  inputMode,
  maxLength,
  required,
  optional,
  uppercase,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  hint?: string;
  type?: string;
  step?: number;
  min?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  required?: boolean;
  optional?: boolean;
  uppercase?: boolean;
}) {
  const controlled = value !== undefined;
  return (
    <div>
      <FieldLabel>
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>}
      </FieldLabel>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        {...(controlled
          ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
          : { defaultValue })}
        required={required}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 ${
          uppercase ? "uppercase placeholder:normal-case" : ""
        }`}
      />
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium text-gray-800 dark:text-white/90 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
