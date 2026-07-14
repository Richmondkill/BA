"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/layout/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/client") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Native-app-style bottom tab bar for the client area. Mobile only — on lg+
 * the regular sidebar dashboard takes over (`lg:hidden`).
 */
export default function ClientMobileNav() {
  const pathname = usePathname();
  const items = navForRole("CLIENT");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-900/90 lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center transition-transform ${
                    active ? "scale-110" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
