import { Prisma } from "@/generated/prisma/client";

/**
 * Money helpers. We keep amounts as Prisma.Decimal end-to-end and only
 * convert to string/number at the UI boundary.
 */

export type DecimalInput = Prisma.Decimal | number | string;

// Single source of truth for currency formatting (client-safe, no Prisma).
export { formatMoney } from "./format";

export function toDecimal(value: DecimalInput): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

/** Parse a user-entered amount into a positive Decimal, or throw. */
export function parseAmount(input: string | number): Prisma.Decimal {
  const dec = new Prisma.Decimal(input);
  if (!dec.isFinite() || dec.lessThanOrEqualTo(0)) {
    throw new Error("Amount must be a positive number.");
  }
  // Round to 2 decimal places.
  return dec.toDecimalPlaces(2);
}
