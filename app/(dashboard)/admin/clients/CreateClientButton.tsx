"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/actions/clients";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { PlusIcon } from "@/icons";

export default function CreateClientButton() {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createClient(new FormData(e.currentTarget));
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" startIcon={<PlusIcon />} onClick={openModal}>
        New Client
      </Button>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[500px] p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Create client
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Creates a client with a wallet. You can fund it now or later.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Jane Doe" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="jane@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="text" placeholder="At least 6 characters" />
          </div>
          <div>
            <Label htmlFor="initialBalance">Initial balance (optional)</Label>
            <Input id="initialBalance" name="initialBalance" type="number" step={0.01} min="0" placeholder="0.00" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Creating…" : "Create client"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
