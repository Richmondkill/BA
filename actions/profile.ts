"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { ActionResult } from "@/lib/action-result";

const profileSchema = z.object({
  firstName: z.string().max(60).optional(),
  lastName: z.string().max(60).optional(),
  email: z.string().email("Enter a valid email").optional(),
  phone: z.string().max(40).optional(),
  bio: z.string().max(200).optional(),
  country: z.string().max(80).optional(),
  cityState: z.string().max(120).optional(),
  postalCode: z.string().max(40).optional(),
  taxId: z.string().max(60).optional(),
  facebook: z.string().max(200).optional(),
  twitter: z.string().max(200).optional(),
  linkedin: z.string().max(200).optional(),
  instagram: z.string().max(200).optional(),
});

const FIELDS = Object.keys(profileSchema.shape) as (keyof typeof profileSchema.shape)[];

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("CLIENT");

  // Only pick fields that were actually submitted by this form.
  const raw: Record<string, string> = {};
  for (const key of FIELDS) {
    const v = formData.get(key);
    if (v !== null) raw[key] = String(v);
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // Email change → enforce uniqueness.
  if (data.email && data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== session.user.id) {
      return { ok: false, error: "That email is already in use." };
    }
  }

  // Recompute display name when first/last provided.
  const update: Record<string, string> = { ...data };
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const first = data.firstName ?? current?.firstName ?? "";
    const last = data.lastName ?? current?.lastName ?? "";
    const full = `${first} ${last}`.trim();
    if (full) update.name = full;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: update,
  });

  revalidatePath("/client/profile");
  revalidatePath("/client");
  return { ok: true };
}
