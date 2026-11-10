import { describe, it, expect } from "vitest";
import { partsByCode, attachParts } from "./code-part-recommendations";

const parts = [
  { id: "a", name: "حساس أكسجين", partNumber: null, vehicleIds: ["v1"] },
  { id: "b", name: "بواجي", partNumber: null, vehicleIds: ["v1"] },
  { id: "c", name: "قطعة سيارة أخرى", partNumber: null, vehicleIds: ["v2"] },
];
const links = [{ code: "P0171", part_id: "a" }, { code: "P0300", part_id: "b" }, { code: "P0171", part_id: "c" }];

describe("code part recommendations", () => {
  it("only includes parts that fit the vehicle", () => {
    expect(partsByCode("v1", links, parts).get("P0171")?.map(p => p.id)).toEqual(["a"]);
  });
  it("attaches parts to recommendations by related codes", () => {
    const { recommendations, leftovers } = attachParts([{ related_codes: ["P0171"] }], partsByCode("v1", links, parts), ["P0171", "P0300"]);
    expect(recommendations[0]!.parts.map(p => p.id)).toEqual(["a"]);
    expect(leftovers.map(l => l.part.id)).toEqual(["b"]);
  });
});
