"use client";

import { useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { logout } from "@/actions/auth";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CLIENT: "Client",
};

export default function AppHeader({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user.name.slice(0, 1).toUpperCase();

  // Desktop toggles the collapse; mobile opens the drawer.
  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-1 items-center justify-between px-4 py-3 lg:px-6">
        <button
          aria-label="Toggle sidebar"
          onClick={handleToggle}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggleButton />

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="dropdown-toggle flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.name}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </span>
            </button>

            <Dropdown
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              className="w-64 p-3"
            >
              <div className="border-b border-gray-200 pb-3 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <form action={logout} className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
                >
                  Sign out
                </button>
              </form>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  );
}
