import { describe, expect, it } from "vitest";
import { latestPartPrice, summarizeParts } from "./analytics";
import type { PartPrice, PartStatus } from "../services/parts.service";

function price(id: string, amount: number, date: string): PartPrice {
  return {
    id,
    part_id: "p1",
    supplier_id: null,
    price: amount,
    observed_date: date,
    purchase_url: null,
    notes: null,
    supplier: null,
  };
}

describe("parts analytics", () => {
  it("chooses the newest observed price", () => {
    expect(latestPartPrice([
      price("a", 120, "2026-08-01"),
      price("b", 95, "2026-09-20"),
    ])?.price).toBe(95);
  });

  it("returns null when no price history exists", () => {
    expect(latestPartPrice([])).toBeNull();
  });

  it("summarizes catalog statuses", () => {
    const statuses: PartStatus[] = ["researching", "found", "purchased", "installed", "installed"];
    const result = summarizeParts(statuses.map((status) => ({ status })));
    expect(result).toEqual({ total: 5, researching: 2, purchased: 1, installed: 2 });
  });
});
