const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(cents: number): string {
  return fmt.format(cents / 100);
}

export function calcSave(originalCents: number, priceCents: number): number {
  return Math.round((originalCents - priceCents) / 100);
}
