const twoDecimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number | string): string {
  return twoDecimalFormatter.format(Number(value));
}

export function formatHours(value: number | string): string {
  return twoDecimalFormatter.format(Number(value));
}

export function formatPercent(value: number): string {
  return `${twoDecimalFormatter.format(value)}%`;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(Number(value));
}
