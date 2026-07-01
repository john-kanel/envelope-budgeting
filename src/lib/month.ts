import { format, subMonths } from "date-fns";

export function currentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

export function monthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export function priorMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = subMonths(new Date(year, month - 1, 1), 1);
  return format(date, "yyyy-MM");
}
