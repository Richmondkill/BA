import { requireRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN", "SUPER_ADMIN");
  return <>{children}</>;
}
