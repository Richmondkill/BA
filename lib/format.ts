// Client-safe formatting helpers. No Prisma import, so this can be bundled
// into client components without pulling the Prisma runtime into the browser.

type MoneyInput = number | string | { toNumber: () => number };

/** Format a number / string / Decimal-like value as currency, e.g. "$1,250.00". */
export function formatMoney(
  value: MoneyInput,
  currency = "USD",
  locale = "en-US"
): string {
  const num =
    typeof value === "object" && value !== null && "toNumber" in value
      ? value.toNumber()
      : Number(value);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    num
  );
}
