"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { useSidebar } from "@/context/SidebarContext";
import { navForRole } from "./nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/client") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const items = navForRole(role);
  const showText = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900
        ${showText ? "w-[260px] px-4" : "w-[80px] px-2"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 py-7 ${showText ? "" : "justify-center"}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-theme-md">
          S
        </div>
        {showText && (
          <div className="leading-tight">
            <span className="block text-base font-semibold text-gray-800 dark:text-white/90">
              Scotiabank
            </span>
            <span className="block text-[11px] text-gray-400">
              Wallet console
            </span>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto no-scrollbar pb-6">
        {showText ? (
          <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </p>
        ) : (
          <div className="mx-auto mb-3 h-px w-8 bg-gray-200 dark:bg-gray-800" />
        )}
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
                    showText ? "px-3 py-2.5" : "mx-auto h-11 w-11 justify-center"
                  } ${
                    active
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
                  )}
                  <span
                    className={`flex h-5 w-5 items-center justify-center ${
                      active
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {showText && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: support widget */}
      <div className="shrink-0 border-t border-gray-100 py-4 dark:border-gray-800">
        {showText ? (
          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-4 dark:from-brand-500/10 dark:to-brand-500/[0.06]">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Need help?
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Reach our support team anytime.
            </p>
            <a
              href="mailto:support@scotiabank.test"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Contact support →
            </a>
          </div>
        ) : (
          <a
            href="mailto:support@scotiabank.test"
            title="Contact support"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </a>
        )}
      </div>
    </aside>
  );
}
