import { describe, expect, it } from "vitest";
import {
  buildDiagnosticNarrative,
  diagnosticReportCompleteness,
  diagnosticTestOutcomeSummary,
} from "./report-analytics";
import type { DiagnosticIssue, DiagnosticTest } from "../services/diagnostics.service";

function issue(partial: Partial<DiagnosticIssue> = {}): DiagnosticIssue {
  return {
    id: "i1",
    vehicle_id: "v1",
    title: "تفتفة عند التشغيل",
    symptoms: "اهتزاز أول التشغيل",
    obd_codes: ["P0301"],
    severity: "high",
    status: "resolved",
    first_detected_date: "2026-09-10",
    first_odometer: 190000,
    operating_conditions: "المحرك بارد",
    diagnostic_summary: "تم عزل الخلل إلى الأسطوانة الأولى",
    suspected_cause: "بوجي أو كويل",
    confirmed_cause: "كويل الأسطوانة الأولى",
    root_cause_explanation: "ضعف شرارة الكويل تحت الحمل البارد",
    repair_actions: "استبدال الكويل",
    verification_result: "اختفى التقطيع ولم يعد الكود",
    prevention_notes: "فحص البواجي دوريًا",
    safe_to_drive: true,
    resolution: "تم الاستبدال",
    resolved_date: "2026-09-12",
    resolved_odometer: 190050,
    maintenance_record_id: null,
    part_id: null,
    attachment_url: null,
    notes: null,
    created_at: "",
    updated_at: "",
    vehicle: null,
    part: null,
    maintenance: null,
    events: [],
    tests: [],
    ...partial,
  };
}

describe("comprehensive diagnostic report", () => {
  it("calculates report completeness from structured sections", () => {
    const result = diagnosticReportCompleteness(
      issue({ tests: [{ id:"t1" } as DiagnosticTest] }),
      { manufacturer: "Hyundai", model: "Elantra", model_year: 2011, engine: "1.6" },
    );
    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("summarizes test outcomes", () => {
    const tests = [
      { result_status: "pass" },
      { result_status: "fail" },
      { result_status: "fail" },
      { result_status: "inconclusive" },
    ] as DiagnosticTest[];
    expect(diagnosticTestOutcomeSummary(tests)).toEqual({
      total: 4,
      pass: 1,
      fail: 2,
      inconclusive: 1,
    });
  });

  it("builds an explanatory narrative from recorded facts", () => {
    const lines = buildDiagnosticNarrative(issue(), {
      name: "سيارتي",
      manufacturer: "Hyundai",
      model: "Elantra",
      model_year: 2011,
      engine: "1.6",
    });
    expect(lines.join(" ")).toContain("Hyundai Elantra 2011");
    expect(lines.join(" ")).toContain("السبب المؤكد");
    expect(lines.join(" ")).toContain("التحقق بعد الإصلاح");
  });
});
