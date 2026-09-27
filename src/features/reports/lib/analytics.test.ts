import { describe, expect, it } from "vitest";
import {
  categoryExpenseSeries,
  costPer1000Km,
  expensesToCsv,
  filterReportExpenses,
  monthlyExpenseSeries,
  summarizeReport,
  vehicleExpenseSeries,
} from "./analytics";
import type { Expense } from "@/features/expenses/services/expenses.service";

function expense(
  id: string,
  amount: number,
  date: string,
  source: Expense["source"] = "manual",
  vehicleId = "v1",
  category = { code: "fuel", name_ar: "وقود" },
): Expense {
  return {
    id,
    vehicle_id: vehicleId,
    category_id: "c1",
    expense_date: date,
    amount,
    odometer: null,
    vendor_name: null,
    description: null,
    notes: null,
    receipt_url: null,
    source,
    maintenance_record_id: source === "maintenance" ? "m1" : null,
    part_installation_id: source === "part" ? "p1" : null,
    created_at: date + "T00:00:00Z",
    category,
    vehicle: { name: vehicleId === "v1" ? "إلنترا" : "سيارة 2" },
  };
}

describe("reports analytics", () => {
  const now = new Date(2026, 8, 27);
  const rows = [
    expense("1", 200, "2026-09-05"),
    expense("2", 800, "2026-09-10", "maintenance", "v1", { code: "maintenance", name_ar: "صيانة" }),
    expense("3", 300, "2026-08-01", "part", "v2", { code: "parts", name_ar: "قطع غيار" }),
    expense("4", 150, "2026-01-01"),
  ];

  it("filters by period and vehicle", () => {
    expect(filterReportExpenses(rows, "3m", "v1", now).map((row) => row.id)).toEqual(["1", "2"]);
  });

  it("separates maintenance, parts and other spending", () => {
    expect(summarizeReport(rows)).toEqual({
      total: 1450,
      maintenance: 800,
      parts: 300,
      other: 350,
      count: 4,
    });
  });

  it("fills missing months with zero in monthly trend", () => {
    const series = monthlyExpenseSeries(filterReportExpenses(rows, "3m", "all", now), "3m", now);
    expect(series.map((point) => [point.key, point.amount])).toEqual([
      ["2026-07", 0],
      ["2026-08", 300],
      ["2026-09", 1000],
    ]);
  });

  it("groups categories and vehicles", () => {
    expect(categoryExpenseSeries(rows)[0]?.amount).toBe(800);
    expect(vehicleExpenseSeries(rows)[0]).toMatchObject({ key: "v1", amount: 1150 });
  });

  it("calculates lifetime operating cost per 1000 km", () => {
    const value = costPer1000Km(
      { id: "v1", purchase_odometer: 100000, current_odometer: 110000 },
      rows,
    );
    expect(value).toBe(115);
  });

  it("exports csv safely", () => {
    const csv = expensesToCsv([
      { ...rows[0]!, description: 'قال "اختبار"' },
    ]);
    expect(csv).toContain('"قال ""اختبار"""');
  });
});
