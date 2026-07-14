import { requireRole } from "@/lib/rbac";
import ClientMobileNav from "./ClientMobileNav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("CLIENT");
  return (
    <>
      {/* Extra bottom space on mobile so content clears the fixed tab bar. */}
      <div className="pb-24 lg:pb-0">{children}</div>
      <ClientMobileNav />
    </>
  );
}
