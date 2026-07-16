export function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");

  const start = `${year}-${pad(month + 1)}-01`;
  const nextMonth =
    month === 11 ? { y: year + 1, m: 1 } : { y: year, m: month + 2 };
  const end = `${nextMonth.y}-${pad(nextMonth.m)}-01`;

  return { start, end };
}
