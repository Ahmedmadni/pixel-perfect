import type { Expense } from "../services/expenses.service";

export interface ExpenseSummary {
  month: string;
  total: number;
  manual: number;
  maintenance: number;
  count: number;
  byCategory: { code: string; name: string; amount: number }[];
}

export function currentMonthKey(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0")].join("-");
}

export function summarizeExpenses(expenses: Expense[], month = currentMonthKey()): ExpenseSummary {
  const rows = expenses.filter((expense) => expense.expense_date.slice(0, 7) === month);
  const categories = new Map<string, { code: string; name: string; amount: number }>();

  for (const expense of rows) {
    const code = expense.category?.code ?? "other";
    const name = expense.category?.name_ar ?? "أخرى";
    const current = categories.get(code) ?? { code, name, amount: 0 };
    current.amount += expense.amount;
    categories.set(code, current);
  }

  return {
    month,
    total: rows.reduce((sum, expense) => sum + expense.amount, 0),
    manual: rows.filter((expense) => expense.source !== "maintenance").reduce((sum, expense) => sum + expense.amount, 0),
    maintenance: rows.filter((expense) => expense.source === "maintenance").reduce((sum, expense) => sum + expense.amount, 0),
    count: rows.length,
    byCategory: [...categories.values()].sort((a, b) => b.amount - a.amount),
  };
}
