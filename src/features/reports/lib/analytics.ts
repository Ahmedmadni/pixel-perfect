import type { Expense } from "@/features/expenses/services/expenses.service";
import type { Vehicle } from "@/types/vehicle";

export type ReportPeriod = "3m" | "6m" | "12m" | "all";

export interface ReportSummary {
  total: number;
  maintenance: number;
  parts: number;
  other: number;
  count: number;
}

export interface SeriesPoint {
  key: string;
  label: string;
  amount: number;
}

function localMonthKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

export function reportStartDate(period: ReportPeriod, now = new Date()): string | null {
  if (period === "all") return null;
  const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
}

export function filterReportExpenses(
  expenses: Expense[],
  period: ReportPeriod,
  vehicleId: string | "all",
  now = new Date(),
): Expense[] {
  const start = reportStartDate(period, now);
  return expenses.filter((expense) => {
    if (vehicleId !== "all" && expense.vehicle_id !== vehicleId) return false;
    if (start && expense.expense_date < start) return false;
    return true;
  });
}

export function summarizeReport(expenses: Expense[]): ReportSummary {
  const maintenance = expenses
    .filter((expense) => expense.source === "maintenance")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const parts = expenses
    .filter((expense) => expense.source === "part")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    total,
    maintenance,
    parts,
    other: total - maintenance - parts,
    count: expenses.length,
  };
}

function monthsForPeriod(
  expenses: Expense[],
  period: ReportPeriod,
  now: Date,
): string[] {
  if (period !== "all") {
    const count = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
      return localMonthKey(date);
    });
  }

  const keys = expenses.map((expense) => expense.expense_date.slice(0, 7)).sort();
  if (!keys.length) return [localMonthKey(now)];

  const [startYear, startMonth] = keys[0]!.split("-").map(Number);
  const [endYear, endMonth] = keys[keys.length - 1]!.split("-").map(Number);
  const cursor = new Date(startYear!, startMonth! - 1, 1);
  const end = new Date(endYear!, endMonth! - 1, 1);
  const result: string[] = [];

  while (cursor <= end) {
    result.push(localMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

export function monthlyExpenseSeries(
  expenses: Expense[],
  period: ReportPeriod,
  now = new Date(),
): SeriesPoint[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.expense_date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }

  return monthsForPeriod(expenses, period, now).map((key) => {
    const [year, month] = key.split("-");
    return {
      key,
      label: month + "/" + year,
      amount: totals.get(key) ?? 0,
    };
  });
}

export function categoryExpenseSeries(expenses: Expense[]): SeriesPoint[] {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const expense of expenses) {
    const key = expense.category?.code ?? "other";
    const label = expense.category?.name_ar ?? "أخرى";
    const current = totals.get(key) ?? { label, amount: 0 };
    current.amount += expense.amount;
    totals.set(key, current);
  }
  return [...totals.entries()]
    .map(([key, value]) => ({ key, label: value.label, amount: value.amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function vehicleExpenseSeries(expenses: Expense[]): SeriesPoint[] {
  const totals = new Map<string, { label: string; amount: number }>();
  for (const expense of expenses) {
    const key = expense.vehicle_id;
    const label = expense.vehicle?.name ?? "سيارة";
    const current = totals.get(key) ?? { label, amount: 0 };
    current.amount += expense.amount;
    totals.set(key, current);
  }
  return [...totals.entries()]
    .map(([key, value]) => ({ key, label: value.label, amount: value.amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function lifetimeOperatingCost(expenses: Expense[], vehicleId: string): number {
  return expenses
    .filter((expense) => expense.vehicle_id === vehicleId)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function costPer1000Km(
  vehicle: Pick<Vehicle, "id" | "purchase_odometer" | "current_odometer">,
  expenses: Expense[],
): number | null {
  if (vehicle.purchase_odometer == null) return null;
  const distance = vehicle.current_odometer - vehicle.purchase_odometer;
  if (distance <= 0) return null;
  return (lifetimeOperatingCost(expenses, vehicle.id) / distance) * 1000;
}

export function expensesToCsv(expenses: Expense[]): string {
  const rows = [
    ["date", "vehicle", "category", "source", "amount_sar", "odometer", "vendor", "description"],
    ...expenses.map((expense) => [
      expense.expense_date,
      expense.vehicle?.name ?? "",
      expense.category?.name_ar ?? "",
      expense.source,
      expense.amount.toFixed(2),
      expense.odometer?.toString() ?? "",
      expense.vendor_name ?? "",
      expense.description ?? "",
    ]),
  ];

  const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
  return rows.map((row) => row.map(quote).join(",")).join("\n");
}
