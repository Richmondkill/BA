import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/rbac";
import RegisterExperience from "./RegisterExperience";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect(homeForRole(session.user.role));

  return <RegisterExperience year={new Date().getFullYear()} />;
}
