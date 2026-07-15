"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fundWallet, unlockClient } from "@/actions/wallet";
import {
  setClientStatus,
  updateClient,
  resetClientPassword,
  deleteClient,
} from "@/actions/clients";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  DollarLineIcon,
  MailIcon,
  PencilIcon,
  LockIcon,
  TrashBinIcon,
} from "@/icons";

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

/** Opens the admin's own mail client, pre-addressed to the client. */
export function SendMailButton({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const subject = encodeURIComponent("A message from Scotiabank");
  const body = encodeURIComponent(`Hi ${name},\n\n`);
  return (
    <a
      href={`mailto:${email}?subject=${subject}&body=${body}`}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
    >
      <MailIcon />
      Send mail
    </a>
  );
}

export function ClientStatusButton({
  clientId,
  status,
}: {
  clientId: string;
  status: "ACTIVE" | "SUSPENDED";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const suspend = status === "ACTIVE";

  async function run() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("status", suspend ? "SUSPENDED" : "ACTIVE");
    const res = await setClientStatus(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <ErrorBox msg={error} />}
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition disabled:opacity-50 ${
          suspend
            ? "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-200 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/30"
            : "bg-success-50 text-success-700 ring-1 ring-inset ring-success-200 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/30"
        }`}
      >
        {pending ? "Working…" : suspend ? "Suspend client" : "Reactivate client"}
      </button>
    </div>
  );
}

export function EditClientButton({
  clientId,
  name,
  email,
}: {
  clientId: string;
  name: string;
  email: string;
}) {
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
    const res = await updateClient(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" startIcon={<PencilIcon />} onClick={openModal}>
        Edit
      </Button>
      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Edit client
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBox msg={error} />}
          <div>
            <Label htmlFor="edit-name">Full name</Label>
            <Input id="edit-name" name="name" defaultValue={name} />
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" name="email" type="email" defaultValue={email} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ResetPasswordButton({ clientId }: { clientId: string }) {
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    const res = await resetClientPassword(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    setDone(true);
  }

  function close() {
    closeModal();
    setTimeout(() => {
      setDone(false);
      setError(null);
    }, 200);
  }

  return (
    <>
      <Button size="sm" variant="outline" startIcon={<LockIcon />} onClick={openModal}>
        Reset password
      </Button>
      <Modal isOpen={isOpen} onClose={close} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Reset password
        </h3>
        {done ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
              Password updated. Share the new password with the client securely.
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={close}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <ErrorBox msg={error} />}
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="password"
                type="text"
                placeholder="At least 6 characters"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Update password"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export function DeleteClientButton({
  clientId,
  name,
}: {
  clientId: string;
  name: string;
}) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("clientId", clientId);
    const res = await deleteClient(fd);
    if (!res.ok) {
      setPending(false);
      return setError(res.error);
    }
    // Client is gone — leave the detail page.
    router.push("/admin/clients");
  }

  function close() {
    closeModal();
    setTimeout(() => {
      setConfirm("");
      setError(null);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm font-medium text-error-600 ring-1 ring-inset ring-error-200 transition hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:ring-error-500/30"
      >
        <TrashBinIcon />
        Delete client
      </button>
      <Modal isOpen={isOpen} onClose={close} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete client
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          This permanently removes <span className="font-medium">{name}</span>,
          their wallet, transactions and beneficiaries. This cannot be undone. Type{" "}
          <span className="font-mono font-semibold text-error-600 dark:text-error-400">
            DELETE
          </span>{" "}
          to confirm.
        </p>
        <div className="space-y-4">
          {error && <ErrorBox msg={error} />}
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-error-300 focus:outline-hidden focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending || confirm !== "DELETE"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
