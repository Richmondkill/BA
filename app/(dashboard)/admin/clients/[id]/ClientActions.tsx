"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fundWallet, unlockClient } from "@/actions/wallet";
import { createPayee } from "@/actions/payees";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { PlusIcon, DollarLineIcon } from "@/icons";

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
      {msg}
    </div>
  );
}

export function FundWalletButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    const res = await fundWallet(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" startIcon={<DollarLineIcon />} onClick={openModal}>
        Fund wallet
      </Button>
      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Fund wallet
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBox msg={error} />}
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step={0.01} min="0" placeholder="0.00" />
          </div>
          <div>
            <Label htmlFor="description">Note (optional)</Label>
            <Input id="description" name="description" placeholder="e.g. Top-up" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Funding…" : "Add funds"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AddPayeeButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    const res = await createPayee(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" startIcon={<PlusIcon />} onClick={openModal}>
        Add payee
      </Button>
      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add payee
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          This payee will be visible to the client to pay.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBox msg={error} />}
          <div>
            <Label htmlFor="name">Payee name</Label>
            <Input id="name" name="name" placeholder="Acme Supplies" />
          </div>
          <div>
            <Label htmlFor="bankName">Bank</Label>
            <Input id="bankName" name="bankName" placeholder="First National Bank" />
          </div>
          <div>
            <Label htmlFor="accountNumber">Account number</Label>
            <Input id="accountNumber" name="accountNumber" placeholder="0123456789" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save payee"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function UnlockButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(mode: "reset" | "extend") {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("mode", mode);
    fd.set("by", "4");
    const res = await unlockClient(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <ErrorBox msg={error} />}
      <div className="flex flex-wrap gap-3">
        <Button size="sm" disabled={pending} onClick={() => run("reset")}>
          {pending ? "Working…" : "Reset count to 0"}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("extend")}>
          Add 4 more transfers
        </Button>
      </div>
    </div>
  );
}
