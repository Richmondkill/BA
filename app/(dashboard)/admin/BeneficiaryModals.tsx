"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPayee, assignPayee } from "@/actions/payees";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { PlusIcon, CopyIcon, CheckLineIcon } from "@/icons";

export type ClientOption = { id: string; name: string; email: string };

type CreatedBeneficiary = {
  name: string;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  swift: string;
  address: string;
  clientName?: string;
};

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
      {msg}
    </div>
  );
}

function detailsText(b: CreatedBeneficiary): string {
  return [
    `Beneficiary: ${b.name}`,
    `Bank: ${b.bankName}`,
    `Institution number: ${b.institutionNumber}`,
    `Transit number: ${b.transitNumber}`,
    `Account number: ${b.accountNumber}`,
    `SWIFT/BIC: ${b.swift || "—"}`,
    `Address: ${b.address || "—"}`,
    `Assigned to: ${b.clientName || "Unassigned"}`,
  ].join("\n");
}

/**
 * Create a beneficiary. Pass `clientId` to tie it to a specific client, or pass
 * `clients` to show an optional client picker (omit selection for unassigned).
 */
export function CreateBeneficiaryButton({
  clientId,
  clients,
  triggerLabel = "Add beneficiary",
  triggerClassName,
}: {
  clientId?: string;
  clients?: ClientOption[];
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<CreatedBeneficiary | null>(null);
  const [copied, setCopied] = useState(false);

  const showClientPicker = !clientId && !!clients;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (clientId) fd.set("clientId", clientId);

    const res = await createPayee(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);

    const pickedClientId = clientId ?? String(fd.get("clientId") ?? "");
    setCreated({
      name: String(fd.get("name") ?? ""),
      bankName: String(fd.get("bankName") ?? ""),
      institutionNumber: String(fd.get("institutionNumber") ?? ""),
      transitNumber: String(fd.get("transitNumber") ?? ""),
      accountNumber: String(fd.get("accountNumber") ?? ""),
      swift: String(fd.get("swift") ?? ""),
      address: String(fd.get("address") ?? ""),
      clientName: pickedClientId
        ? clients?.find((c) => c.id === pickedClientId)?.name ?? "Assigned"
        : undefined,
    });
    router.refresh();
  }

  function reset() {
    setCreated(null);
    setError(null);
    setCopied(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 200);
  }

  async function copyDetails() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(detailsText(created));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        startIcon={<PlusIcon />}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </Button>

      <Modal isOpen={open} onClose={close} className="m-4 max-h-[92vh] max-w-[460px] overflow-y-auto p-6">
        {created ? (
          <div>
            <div className="mb-4 flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15">
                <CheckLineIcon />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Beneficiary created
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {created.clientName
                  ? `Assigned to ${created.clientName}.`
                  : "Unassigned — assign it to a client anytime."}
              </p>
            </div>

            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
              <Row label="Beneficiary" value={created.name} />
              <Row label="Bank" value={created.bankName} />
              <Row label="Institution no." value={created.institutionNumber} mono />
              <Row label="Transit no." value={created.transitNumber} mono />
              <Row label="Account no." value={created.accountNumber} mono />
              {created.swift && <Row label="SWIFT/BIC" value={created.swift} mono />}
              {created.address && <Row label="Address" value={created.address} />}
            </div>

            <button
              type="button"
              onClick={copyDetails}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              {copied ? (
                <>
                  <CheckLineIcon /> Copied
                </>
              ) : (
                <>
                  <CopyIcon /> Copy all details
                </>
              )}
            </button>

            <div className="mt-3 flex gap-3">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={reset}>
                Create another
              </Button>
              <Button type="button" size="sm" className="flex-1" onClick={close}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
              Add beneficiary
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {showClientPicker
                ? "Fill in the banking details. Assign it to a client now or leave it unassigned."
                : "This beneficiary will be visible to the client to pay."}
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <ErrorBox msg={error} />}

              {showClientPicker && (
                <div>
                  <Label htmlFor="clientId">Assign to client (optional)</Label>
                  <select id="clientId" name="clientId" defaultValue="" className={selectClass}>
                    <option value="">Unassigned</option>
                    {clients?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label htmlFor="name">Beneficiary name</Label>
                <Input id="name" name="name" placeholder="Acme Supplies Inc." />
              </div>
              <div>
                <Label htmlFor="bankName">Bank</Label>
                <Input id="bankName" name="bankName" placeholder="Scotiabank" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="institutionNumber">Institution no.</Label>
                  <Input id="institutionNumber" name="institutionNumber" placeholder="002" />
                </div>
                <div>
                  <Label htmlFor="transitNumber">Transit no.</Label>
                  <Input id="transitNumber" name="transitNumber" placeholder="00152" />
                </div>
              </div>
              <div>
                <Label htmlFor="accountNumber">Account number</Label>
                <Input id="accountNumber" name="accountNumber" placeholder="0123456789" />
              </div>
              <div>
                <Label htmlFor="swift">SWIFT / BIC (optional)</Label>
                <Input id="swift" name="swift" placeholder="NOSCCATT" />
              </div>
              <div>
                <Label htmlFor="address">Beneficiary address (optional)</Label>
                <Input id="address" name="address" placeholder="Street, city, province, postal code" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Saving…" : "Save beneficiary"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}

/** Assign an existing (unassigned) beneficiary to a client. */
export function AssignBeneficiaryButton({
  payeeId,
  clients,
}: {
  payeeId: string;
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("payeeId", payeeId);
    const res = await assignPayee(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-400 dark:hover:bg-brand-500/10"
      >
        Assign to client
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="m-4 max-w-[420px] p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Assign beneficiary
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Choose the client who should be able to pay this beneficiary.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBox msg={error} />}
          <div>
            <Label htmlFor={`assign-${payeeId}`}>Client</Label>
            <select id={`assign-${payeeId}`} name="clientId" defaultValue="" className={selectClass}>
              <option value="" disabled>
                Select a client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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
