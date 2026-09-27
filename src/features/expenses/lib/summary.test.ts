import { describe, expect, it } from "vitest";
import { currentMonthKey, summarizeExpenses } from "./summary";
import type { Expense } from "../services/expenses.service";

function expense(partial: Partial<Expense>): Expense {
  return {
    id: partial.id ?? "e1",
    vehicle_id: partial.vehicle_id ?? "v1",
    category_id: partial.category_id ?? "c1",
    expense_date: partial.expense_date ?? "2026-09-10",
    amount: partial.amount ?? 100,
    odometer: null,
    vendor_name: null,
    description: null,
    notes: null,
    receipt_url: null,
    source: partial.source ?? "manual",
    maintenance_record_id: partial.maintenance_record_id ?? null,
    created_at: "2026-09-10T00:00:00Z",
    category: partial.category ?? { code: "fuel", name_ar: "وقود" },
    vehicle: partial.vehicle ?? { name: "سيارتي" },
  };
}

describe("expense summary", () => {
  it("creates a local YYYY-MM key", () => {
    expect(currentMonthKey(new Date(2026, 8, 27))).toBe("2026-09");
  });

  it("summarizes only the requested month and separates maintenance", () => {
    const result = summarizeExpenses([
      expense({ id: "1", amount: 200, source: "manual" }),
      expense({ id: "2", amount: 800, source: "maintenance", category: { code: "maintenance", name_ar: "صيانة" } }),
      expense({ id: "3", expense_date: "2026-08-31", amount: 900 }),
    ], "2026-09");

    expect(result.total).toBe(1000);
    expect(result.manual).toBe(200);
    expect(result.maintenance).toBe(800);
    expect(result.count).toBe(2);
  });

  it("groups category totals from largest to smallest", () => {
    const result = summarizeExpenses([
      expense({ id: "1", amount: 100 }),
      expense({ id: "2", amount: 50 }),
      expense({ id: "3", amount: 400, category: { code: "insurance", name_ar: "تأمين" } }),
    ], "2026-09");

    expect(result.byCategory).toEqual([
      { code: "insurance", name: "تأمين", amount: 400 },
      { code: "fuel", name: "وقود", amount: 150 },
    ]);
  });
});
