export function dollarsToCents(amount: number) {
  return Math.round(amount * 100);
}

export function centsToDollars(cents: number) {
  return cents / 100;
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsToDollars(cents));
}
