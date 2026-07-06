"use server";

import { Prisma } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createClientSchema } from "@/lib/validation";
import { parseAmount } from "@/lib/money";
import type { ActionResult } from "@/lib/action-result";

/** Admin (or super admin) creates a client + wallet, optionally pre-funded. */
export async function createClient(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    initialBalance: formData.get("initialBalance") ?? 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { ok: false, error: "That email is already in use." };

  let initial = new Prisma.Decimal(0);
  if (parsed.data.initialBalance > 0) {
    try {
      initial = parseAmount(parsed.data.initialBalance);
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "CLIENT",
      createdById: session.user.id,
      wallet: {
        create: {
          balance: initial,
          transactions: initial.greaterThan(0)
            ? {
                create: {
                  type: "CREDIT",
                  status: "COMPLETED",
                  amount: initial,
                  balanceAfter: initial,
                  description: "Initial funding",
                  createdById: session.user.id,
                },
              }
            : undefined,
        },
      },
    },
  });

  revalidatePath("/admin/clients");
  return { ok: true };
}
