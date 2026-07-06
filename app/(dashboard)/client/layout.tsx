import { requireRole } from "@/lib/rbac";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("CLIENT");
  return <>{children}</>;
}
