import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/rbac";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(homeForRole(session.user.role));
}
