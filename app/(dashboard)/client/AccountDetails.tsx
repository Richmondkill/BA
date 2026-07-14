"use client";

import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import CopyButton from "./CopyButton";

export default function AccountDetails({
  holder,
  accountNumber,
  iban,
  routing,
  currency,
  balance,
  status,
  memberSince,
  accountType,
}: {
  holder: string;
  accountNumber: string;
  iban: string;
  routing: string;
  currency: string;
  balance: string;
  status: "Active" | "Suspended";
  memberSince: string;
  accountType: string;
}) {
  const { isOpen, openModal, closeModal } = useModal();

  const rows: { label: string; value: string; copy?: string }[] = [
    { label: "Account holder", value: holder },
    { label: "Account number", value: accountNumber, copy: accountNumber },
    { label: "IBAN", value: iban, copy: iban },
    { label: "Routing / SWIFT", value: routing, copy: routing },
    { label: "Account type", value: accountType },
    { label: "Currency", value: currency },
    { label: "Available balance", value: balance },
    { label: "Member since", value: memberSince },
  ];

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
      >
        See Details
      </button>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[480px]">
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Account details
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your primary wallet
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status === "Active"
                  ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                  : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
              }`}
            >
              {status}
            </span>
          </div>

          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{r.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {r.value}
                  </span>
                  {r.copy && <CopyButton text={r.copy} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
