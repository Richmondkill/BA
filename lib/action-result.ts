// Shared, non-"use server" values used by both server actions and client
// components. Server-action files may only export async functions, so these
// live here instead.

export type ActionResult = { ok: true } | { ok: false; error: string };

export const CONTACT_SUPPORT_MESSAGE =
  "Your account has been suspended due to unusual transfer activity. Please contact support to restore access.";

// Returned when a client tries to transfer to an account that isn't one of
// their saved beneficiaries. Used as a sentinel the transfer UI matches on.
export const NOT_A_BENEFICIARY_MESSAGE =
  "For your security, transfers can only be sent to your saved beneficiaries. Please contact support to add this recipient to your beneficiary list.";
