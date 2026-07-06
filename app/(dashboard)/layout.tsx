import { requireSession } from "@/lib/rbac";
import AppShell from "@/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const user = {
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    role: session.user.role,
  };
  return <AppShell user={user}>{children}</AppShell>;
}
