import { describe, it, expect } from "vitest";
import { getTechnicalCodeKnowledge, matchesPartKind } from "./technical-code-knowledge";
import { partsForCause, technicalPartsByCode } from "./technical-code-parts";
import { attachParts } from "./code-part-recommendations";

const parts = [
  { id: "front", name: "حساس أكسجين أمامي", partNumber: "O2-1", vehicleIds: ["elantra"] },
  { id: "rear", name: "حساس أكسجين خلفي", partNumber: null, vehicleIds: ["elantra"] },
  { id: "plug", name: "بواجي", partNumber: null, vehicleIds: ["elantra"] },
  { id: "other", name: "حساس أكسجين أمامي", partNumber: null, vehicleIds: ["other"] },
  { id: "archived", name: "بواجي", partNumber: null, vehicleIds: ["elantra"], status: "archived" },
];
describe("sourced causes and vehicle-specific catalog suggestions", () => {
  it("maps P0171 to intake, fuel and upstream sensor checks rather than assuming a failed sensor", () => {
    const knowledge = getTechnicalCodeKnowledge("P0171");
    expect(knowledge?.causes.map(c => c.partKinds)).toEqual([["intake", "pcv"], ["maf"], ["fuel", "injector"], ["front-o2"]]);
    expect(knowledge?.source.url).toBe("https://www.obd-codes.com/p0171");
  });
  it("does not invent technical causes for an unsupported code", () => {
    expect(getTechnicalCodeKnowledge("P1999")).toBeNull();
  });
  it("limits suggested parts to the selected vehicle, position and non-archived catalog", () => {
    const map = technicalPartsByCode("elantra", ["P0171", "P0300"], [], parts);
    expect(map.get("P0171")?.map(p => p.id)).toEqual(["front"]);
    expect(map.get("P0300")?.map(p => p.id)).toEqual(["plug"]);
  });
  it("includes the same real parts in AI recommendations without duplicating explicit links", () => {
    const map = technicalPartsByCode("elantra", ["P0171"], [{ code: "P0171", part_id: "front" }], parts);
    expect(attachParts([{ related_codes: ["P0171"] }], map, ["P0171"]).recommendations[0]?.parts.map(p => p.id)).toEqual(["front"]);
  });
  it("supports Arabic and English names but does not match an ambiguous generic O2 sensor", () => {
    expect(matchesPartKind("Upstream oxygen sensor", "front-o2")).toBe(true);
    expect(matchesPartKind("حساس أكسجين", "front-o2")).toBe(false);
    expect(matchesPartKind("حساس أكسجين أمامي خلفي", "front-o2")).toBe(false);
  });
  it("leaves mechanical compression checks without invented replacement parts", () => {
    const cause = getTechnicalCodeKnowledge("P0300")?.causes[2];
    expect(cause).toBeDefined();
    if (!cause) throw new Error("missing cause");
    expect(partsForCause("elantra", cause, parts)).toEqual([]);
  });
});