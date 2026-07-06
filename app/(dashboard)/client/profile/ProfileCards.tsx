"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";
import { changePassword } from "@/actions/security";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

export type Profile = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  country: string;
  cityState: string;
  postalCode: string;
  taxId: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
};

function PencilIcon() {
  return (
    <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
        fill=""
      />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20">
      <path d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z" />
    </svg>
  ),
  twitter: (
    <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20">
      <path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z" />
    </svg>
  ),
  linkedin: (
    <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20">
      <path d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z" />
    </svg>
  ),
  instagram: (
    <svg className="fill-current" width="18" height="18" viewBox="0 0 20 20">
      <path d="M10 1.667c2.277 0 2.563.01 3.457.05.89.041 1.498.181 2.03.388a4.1 4.1 0 0 1 1.481.964c.463.463.749.928.964 1.481.207.532.347 1.14.388 2.03.04.894.05 1.18.05 3.457s-.01 2.563-.05 3.457c-.041.89-.181 1.498-.388 2.03a4.1 4.1 0 0 1-.964 1.481 4.1 4.1 0 0 1-1.481.964c-.532.207-1.14.347-2.03.388-.894.04-1.18.05-3.457.05s-2.563-.01-3.457-.05c-.89-.041-1.498-.181-2.03-.388a4.1 4.1 0 0 1-1.481-.964 4.1 4.1 0 0 1-.964-1.481c-.207-.532-.347-1.14-.388-2.03-.04-.894-.05-1.18-.05-3.457s.01-2.563.05-3.457c.041-.89.181-1.498.388-2.03a4.1 4.1 0 0 1 .964-1.481 4.1 4.1 0 0 1 1.481-.964c.532-.207 1.14-.347 2.03-.388.894-.04 1.18-.05 3.457-.05Zm0 4.166a4.167 4.167 0 1 0 0 8.334 4.167 4.167 0 0 0 0-8.334Zm0 1.667a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm4.375-2.917a1.042 1.042 0 1 0 0 2.083 1.042 1.042 0 0 0 0-2.083Z" />
    </svg>
  ),
};

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
    >
      <PencilIcon />
      Edit
    </button>
  );
}

function useProfileForm(onDone: () => void) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await updateProfile(new FormData(e.currentTarget));
    setPending(false);
    if (!res.ok) return setError(res.error);
    onDone();
    router.refresh();
  }
  return { error, pending, onSubmit };
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
      {msg}
    </div>
  );
}

const social = [
  { name: "facebook", label: "Facebook" },
  { name: "twitter", label: "X.com" },
  { name: "linkedin", label: "Linkedin" },
  { name: "instagram", label: "Instagram" },
] as const;

/* ---------------- Meta card ---------------- */
export function ProfileMetaCard({ profile }: { profile: Profile }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { error, pending, onSubmit } = useProfileForm(closeModal);
  const initials = (profile.name || "U").slice(0, 1).toUpperCase();
  const location = profile.cityState || profile.country || "—";

  const links = [
    { href: profile.facebook, key: "facebook", label: "Facebook" },
    { href: profile.twitter, key: "twitter", label: "X" },
    { href: profile.linkedin, key: "linkedin", label: "LinkedIn" },
    { href: profile.instagram, key: "instagram", label: "Instagram" },
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
              {initials}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-center text-lg font-semibold text-gray-800 dark:text-white/90 xl:text-left">
                {profile.name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.bio || "Client"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
              </div>
            </div>
            <div className="order-2 flex grow items-center gap-2 xl:order-3 xl:justify-end">
              {links.map((l) => (
                <a
                  key={l.key}
                  href={l.href || "#"}
                  target="_blank"
                  rel="noreferrer"
                  title={l.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  {SOCIAL_ICONS[l.key]}
                </a>
              ))}
            </div>
          </div>
          <EditButton onClick={openModal} />
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              {error && <ErrorBox msg={error} />}
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Links
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  {social.map((s) => (
                    <div key={s.name}>
                      <Label>{s.label}</Label>
                      <Input name={s.name} type="text" defaultValue={profile[s.name]} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input name="firstName" type="text" defaultValue={profile.firstName} />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input name="lastName" type="text" defaultValue={profile.lastName} />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input name="email" type="text" defaultValue={profile.email} />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input name="phone" type="text" defaultValue={profile.phone} />
                  </div>
                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input name="bio" type="text" defaultValue={profile.bio} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button type="button" size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

/* ---------------- Info card ---------------- */
export function ProfileInfoCard({ profile }: { profile: Profile }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { error, pending, onSubmit } = useProfileForm(closeModal);

  const rows = [
    { label: "First Name", value: profile.firstName },
    { label: "Last Name", value: profile.lastName },
    { label: "Email address", value: profile.email },
    { label: "Phone", value: profile.phone },
    { label: "Bio", value: profile.bio },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            {rows.map((r) => (
              <div key={r.label}>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {r.label}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {r.value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
        <EditButton onClick={openModal} />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="px-2 pb-3">
              {error && <ErrorBox msg={error} />}
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>First Name</Label>
                  <Input name="firstName" type="text" defaultValue={profile.firstName} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Last Name</Label>
                  <Input name="lastName" type="text" defaultValue={profile.lastName} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Email Address</Label>
                  <Input name="email" type="text" defaultValue={profile.email} />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Phone</Label>
                  <Input name="phone" type="text" defaultValue={profile.phone} />
                </div>
                <div className="col-span-2">
                  <Label>Bio</Label>
                  <Input name="bio" type="text" defaultValue={profile.bio} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button type="button" size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Address card ---------------- */
export function ProfileAddressCard({ profile }: { profile: Profile }) {
  const { isOpen, openModal, closeModal } = useModal();
  const { error, pending, onSubmit } = useProfileForm(closeModal);

  const rows = [
    { label: "Country", value: profile.country },
    { label: "City/State", value: profile.cityState },
    { label: "Postal Code", value: profile.postalCode },
    { label: "TAX ID", value: profile.taxId },
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              {rows.map((r) => (
                <div key={r.label}>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    {r.label}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {r.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <EditButton onClick={openModal} />
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[700px]">
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Address
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col">
            <div className="px-2">
              {error && <ErrorBox msg={error} />}
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>Country</Label>
                  <Input name="country" type="text" defaultValue={profile.country} />
                </div>
                <div>
                  <Label>City/State</Label>
                  <Input name="cityState" type="text" defaultValue={profile.cityState} />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input name="postalCode" type="text" defaultValue={profile.postalCode} />
                </div>
                <div>
                  <Label>TAX ID</Label>
                  <Input name="taxId" type="text" defaultValue={profile.taxId} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button type="button" size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

/* ---------------- Security (change password) ---------------- */
export function ChangePasswordCard() {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = e.currentTarget;
    const res = await changePassword(new FormData(form));
    setPending(false);
    if (!res.ok) return setError(res.error);
    form.reset();
    setSuccess(true);
    router.refresh();
  }

  function close() {
    setError(null);
    setSuccess(false);
    closeModal();
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Password &amp; Security
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Keep your account secure with a strong password.
            </p>
          </div>
        </div>
        <EditButton onClick={openModal} />
      </div>

      <Modal isOpen={isOpen} onClose={close} className="m-4 max-w-[500px]">
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Change password
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Enter your current password and choose a new one.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <ErrorBox msg={error} />}
            {success && (
              <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                ✓ Password updated successfully.
              </div>
            )}
            <div>
              <Label>Current password</Label>
              <Input name="currentPassword" type="password" placeholder="••••••••" />
            </div>
            <div>
              <Label>New password</Label>
              <Input name="newPassword" type="password" placeholder="At least 6 characters" />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input name="confirmPassword" type="password" placeholder="Re-enter new password" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" size="sm" variant="outline" onClick={close}>
                Close
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
