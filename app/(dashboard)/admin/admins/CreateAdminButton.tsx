"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdmin } from "@/actions/admins";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { PlusIcon } from "@/icons";

export default function CreateAdminButton() {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createAdmin(new FormData(e.currentTarget));
    setPending(false);
    if (!res.ok) return setError(res.error);
    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" startIcon={<PlusIcon />} onClick={openModal}>
        New Admin
      </Button>
      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[460px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Create admin
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="John Admin" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="admin@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="text" placeholder="At least 6 characters" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Creating…" : "Create admin"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
