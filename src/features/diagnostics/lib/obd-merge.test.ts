import { describe, expect, it } from "vitest";
import { mergeObdCodes } from "./obd-merge";

describe("mergeObdCodes", () => {
  it("user code overrides the standard description for the same code", () => {
    const out = mergeObdCodes(
      [{ code: "P0171", description: "System Too Lean", category: "P" }],
      [{ code: "P0171", description: "خليط فقير - بنك 1", category: "P" }],
    );
    expect(out).toEqual([{ code: "P0171", description: "خليط فقير - بنك 1", category: "P", custom: true }]);
  });
  it("keeps new custom codes with custom categories alongside standard ones", () => {
    const out = mergeObdCodes([{ code: "P0300", description: "Misfire", category: "P" }], [{ code: "HY123", description: "كود هيونداي", category: "مصنّع" }]);
    expect(out.map(r => [r.code, r.custom])).toEqual([["HY123", true], ["P0300", false]]);
  });
});
