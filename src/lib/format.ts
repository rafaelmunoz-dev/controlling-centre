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
