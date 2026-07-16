export type Period = {
  year: number;
  month: number; // 1-12
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD, exclusive (first day of next month)
  value: string; // "YYYY-MM", matches the ?period= query param
  label: string; // "July 2026"
};

function buildPeriod(year: number, month: number): Period {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startDate = `${year}-${pad(month)}-01`;
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const endDate = `${next.y}-${pad(next.m)}-01`;
  const value = `${year}-${pad(month)}`;
  const label = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return { year, month, startDate, endDate, value, label };
}

/**
 * Parses ?period=YYYY-MM into a Period. Falls back to the current month
 * when absent or malformed — never redirects.
 */
export function parsePeriod(searchParams: { period?: string }): Period {
  const raw = searchParams.period;

  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split("-").map(Number);
    if (month >= 1 && month <= 12) {
      return buildPeriod(year, month);
    }
  }

  const now = new Date();
  return buildPeriod(now.getFullYear(), now.getMonth() + 1);
}

/** Last `count` months (including the current one), newest first. */
export function buildPeriodOptions(count = 24): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = buildPeriod(d.getFullYear(), d.getMonth() + 1);
    options.push({ value: period.value, label: period.label });
  }

  return options;
}
