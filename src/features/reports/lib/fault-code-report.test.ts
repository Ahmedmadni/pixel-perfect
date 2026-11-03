import { describe, it, expect } from "vitest";
import { buildFaultCodeReport } from "./fault-code-report";
import type { DiagnosticIssue } from "@/features/diagnostics/services/diagnostics.service";

const issue = (p: Partial<DiagnosticIssue>) => ({ id: "i", vehicle_id: "v1", title: "t", obd_codes: [], status: "open", first_detected_date: "2026-01-01", ...p }) as DiagnosticIssue;

describe("buildFaultCodeReport", () => {
  it("counts repeated codes and only active issues as active", () => {
    const rows = buildFaultCodeReport("v1", [
      issue({ obd_codes: ["p0171"], status: "resolved", first_detected_date: "2026-01-01" }),
      issue({ obd_codes: ["P0171", "P0300"], first_detected_date: "2026-03-01" }),
    ], [{ code: "P0171", description: "System Too Lean", category: "P" }]);
    const p0171 = rows.find(r => r.code === "P0171")!;
    expect(p0171.occurrences).toBe(2);
    expect(p0171.activeOccurrences).toBe(1);
    expect(p0171.firstSeen).toBe("2026-01-01");
    expect(p0171.lastSeen).toBe("2026-03-01");
    expect(p0171.description).toBe("System Too Lean");
  });
  it("ignores other vehicles", () => {
    expect(buildFaultCodeReport("v1", [issue({ vehicle_id: "v2", obd_codes: ["P0171"] })], [])).toHaveLength(0);
  });
});
