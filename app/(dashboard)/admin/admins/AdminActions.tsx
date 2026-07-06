"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { updateAdmin, resetAdminPassword, deleteAdmin } from "@/actions/admins";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import type { ActionResult } from "@/lib/action-result";

type Admin = { id: string; name: string; email: string; status: "ACTIVE" | "SUSPENDED" };
type Which = "edit" | "reset" | "delete" | null;

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
      {msg}
    </div>
  );
}

export default function AdminActions({ admin }: { admin: Admin }) {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [which, setWhich] = useState<Which>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleMenu() {
    if (!menu && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.right - 176 });
    }
    setMenu((v) => !v);
  }

  function open(w: Which) {
    setError(null);
    setWhich(w);
    setMenu(false);
  }
  function close() {
    setWhich(null);
    setError(null);
  }

  async function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setPending(true);
    setError(null);
    const res = await action(fd);
    setPending(false);
    if (!res.ok) return setError(res.error);
    close();
    router.refresh();
  }

  return (
    <div className="relative flex justify-end">
      <button
        ref={btnRef}
        onClick={toggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
        aria-label="Admin actions"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {menu &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[99998]" onClick={() => setMenu(false)} />
            <div
              style={{ top: pos.top, left: pos.left }}
              className="fixed z-[99999] w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
            >
              <button onClick={() => open("edit")} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]">
                Edit details
              </button>
              <button onClick={() => open("reset")} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]">
                Reset password
              </button>
              <button onClick={() => open("delete")} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10">
                Delete admin
              </button>
            </div>
          </>,
          document.body
        )}

      {/* Edit */}
      <Modal isOpen={which === "edit"} onClose={close} className="m-4 max-w-[460px] p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Edit admin
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(updateAdmin, new FormData(e.currentTarget));
          }}
          className="space-y-4 text-left"
        >
          {error && <ErrorBox msg={error} />}
          <input type="hidden" name="id" value={admin.id} />
          <div>
            <Label>Full name</Label>
            <Input name="name" defaultValue={admin.name} />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={admin.email} />
          </div>
          <div>
            <Label>Status</Label>
            <select
              name="status"
              defaultValue={admin.status}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Suspended admins cannot sign in.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset password */}
      <Modal isOpen={which === "reset"} onClose={close} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Reset password
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Set a new password for {admin.name}.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(resetAdminPassword, new FormData(e.currentTarget));
          }}
          className="space-y-4 text-left"
        >
          {error && <ErrorBox msg={error} />}
          <input type="hidden" name="id" value={admin.id} />
          <div>
            <Label>New password</Label>
            <Input name="password" type="text" placeholder="At least 6 characters" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal isOpen={which === "delete"} onClose={close} className="m-4 max-w-[440px] p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Delete admin
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Delete <span className="font-medium text-gray-800 dark:text-white/90">{admin.name}</span>?
          Their clients are kept and become unassigned (still visible to you). This
          cannot be undone.
        </p>
        {error && <ErrorBox msg={error} />}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancel
          </Button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", admin.id);
              run(deleteAdmin, fd);
            }}
            className="rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-error-600 disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete admin"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
