"use client";

import type { Role } from "@/generated/prisma/client";
import { useSidebar } from "@/context/SidebarContext";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";

export default function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar role={user.role} />
      <Backdrop />
      <div
        className={`app-surface min-h-screen flex-1 bg-gray-50 transition-all duration-300 ease-in-out dark:bg-gray-950 ${
          isExpanded ? "lg:ml-[260px]" : "lg:ml-[80px]"
        }`}
      >
        <AppHeader user={user} />
        <main className="mx-auto max-w-[1400px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
