import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeForRole } from "@/lib/rbac";
import LoginExperience from "./LoginExperience";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect(homeForRole(session.user.role));

  return <LoginExperience year={new Date().getFullYear()} />;
}
