// Shared, non-"use server" values used by both server actions and client
// components. Server-action files may only export async functions, so these
// live here instead.

export type ActionResult = { ok: true } | { ok: false; error: string };

export const CONTACT_SUPPORT_MESSAGE =
  "Your account has been paused due to unusual transfer activity. Please contact support to restore access.";
