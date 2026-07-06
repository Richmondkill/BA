import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
};

/** Require an authenticated session; redirect to /login otherwise. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Require the session to hold one of the given roles. */
export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect(homeForRole(session.user.role));
  }
  return session;
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function homeForRole(role: Role): string {
  return role === "CLIENT" ? "/client" : "/admin";
}

/**
 * Whether an admin actor may view/manage a given client record.
 * SUPER_ADMIN can manage everyone; a plain ADMIN only their own creations.
 */
export function canManageClient(
  actor: { id: string; role: Role },
  client: { createdById: string | null }
): boolean {
  if (actor.role === "SUPER_ADMIN") return true;
  if (actor.role === "ADMIN") return client.createdById === actor.id;
  return false;
}

/**
 * Prisma `where` fragment that scopes a client query to what the actor may see.
 * SUPER_ADMIN: all clients. ADMIN: only clients they created.
 */
export function clientScopeWhere(actor: { id: string; role: Role }) {
  const base = { role: "CLIENT" as Role };
  if (actor.role === "SUPER_ADMIN") return base;
  return { ...base, createdById: actor.id };
}
