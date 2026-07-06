import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import TransferLauncher from "../TransferLauncher";
import { PaperPlaneIcon } from "@/icons";

export default async function TransferPage() {
  const session = await requireRole("CLIENT");

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    include: { user: { include: { payees: { orderBy: { createdAt: "desc" } } } } },
  });

  if (!wallet) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No wallet found. Please contact support.
      </p>
    );
  }

  const payees = wallet.user.payees;
  // Note: we deliberately do NOT disable the button when the wallet is locked or
  // over its transfer allowance. The client is allowed to *attempt* the transfer;
  // the server logs a BLOCKED audit row and returns the "contact support" message,
  // which the launcher surfaces as the "paused" modal.
  const disabled = payees.length === 0;
  const holder = wallet.user.name ?? "";
  const last4 = wallet.id.replace(/[^0-9]/g, "").slice(-4).padStart(4, "0");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
          Send money
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Available balance {formatMoney(wallet.balance, wallet.currency)}
        </p>
      </div>

      {payees.length === 0 && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/30 dark:bg-warning-500/10">
          <p className="text-sm text-warning-700 dark:text-warning-400">
            You have no payees assigned yet. Please contact support.
          </p>
        </div>
      )}

      {/* Hero send card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <PaperPlaneIcon />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Start a new transfer
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose a payee and amount — we&apos;ll handle the rest.
            </p>
          </div>
          <TransferLauncher
            payees={payees}
            disabled={disabled}
            currency={wallet.currency}
            holder={holder}
            last4={last4}
            triggerLabel="New transfer"
          />
        </div>
      </div>

      {/* Quick send to payees */}
      {payees.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Quick send
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {payees.map((p) => (
              <TransferLauncher
                key={p.id}
                payees={payees}
                disabled={disabled}
                currency={wallet.currency}
                holder={holder}
                last4={last4}
                defaultPayeeId={p.id}
                triggerClassName="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-theme-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/40"
                triggerContent={
                  <>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {p.name}
                        </span>
                        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                          {p.bankName} · {p.accountNumber}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-brand-500">
                      Send →
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
