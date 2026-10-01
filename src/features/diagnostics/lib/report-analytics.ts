import type { DiagnosticIssue, DiagnosticTest } from "../services/diagnostics.service";
import type { Vehicle } from "@/types/vehicle";

export interface DiagnosticReportCompleteness {
  percent: number;
  completed: number;
  total: number;
  missing: string[];
}

export function diagnosticReportCompleteness(
  issue: DiagnosticIssue,
  vehicle: Pick<Vehicle, "manufacturer" | "model" | "model_year" | "engine">,
): DiagnosticReportCompleteness {
  const checks: Array<[string, boolean]> = [
    ["بيانات السيارة والموديل", Boolean(vehicle.manufacturer && vehicle.model && vehicle.model_year)],
    ["وصف الأعراض", Boolean(issue.symptoms?.trim())],
    ["ظروف ظهور المشكلة", Boolean(issue.operating_conditions?.trim())],
    ["خطوات/اختبارات التشخيص", issue.tests.length > 0],
    ["ملخص التشخيص", Boolean(issue.diagnostic_summary?.trim())],
    ["السبب المؤكد", Boolean(issue.confirmed_cause?.trim())],
    ["شرح السبب الجذري", Boolean(issue.root_cause_explanation?.trim())],
    ["إجراء الإصلاح", Boolean(issue.repair_actions?.trim() || issue.resolution?.trim())],
    ["التحقق بعد الإصلاح", Boolean(issue.verification_result?.trim())],
    ["توصيات الوقاية", Boolean(issue.prevention_notes?.trim())],
  ];

  const completed = checks.filter(([, ok]) => ok).length;
  const total = checks.length;
  return {
    percent: Math.round((completed / total) * 100),
    completed,
    total,
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

export function diagnosticTestOutcomeSummary(tests: DiagnosticTest[]) {
  return {
    total: tests.length,
    pass: tests.filter((test) => test.result_status === "pass").length,
    fail: tests.filter((test) => test.result_status === "fail").length,
    inconclusive: tests.filter((test) => test.result_status === "inconclusive").length,
  };
}

export function buildDiagnosticNarrative(
  issue: DiagnosticIssue,
  vehicle: Pick<Vehicle, "name" | "manufacturer" | "model" | "model_year" | "engine">,
): string[] {
  const vehicleName =
    [vehicle.manufacturer, vehicle.model, vehicle.model_year].filter(Boolean).join(" ") || vehicle.name;

  const lines: string[] = [];
  lines.push(
    "تم تسجيل مشكلة «" +
      issue.title +
      "» على " +
      vehicleName +
      " بتاريخ " +
      issue.first_detected_date +
      (issue.first_odometer != null ? " عند عداد " + issue.first_odometer.toLocaleString("en-US") + " كم." : "."),
  );

  if (issue.symptoms?.trim()) lines.push("الأعراض المبلغ عنها: " + issue.symptoms.trim());
  if (issue.operating_conditions?.trim()) lines.push("ظروف ظهور المشكلة: " + issue.operating_conditions.trim());
  if (issue.obd_codes.length) lines.push("أكواد الفحص المسجلة: " + issue.obd_codes.join("، ") + ".");
  if (issue.diagnostic_summary?.trim()) lines.push("ملخص التشخيص: " + issue.diagnostic_summary.trim());
  if (issue.confirmed_cause?.trim()) lines.push("السبب المؤكد: " + issue.confirmed_cause.trim());
  if (issue.root_cause_explanation?.trim()) lines.push("تفسير السبب الجذري: " + issue.root_cause_explanation.trim());
  if (issue.repair_actions?.trim()) lines.push("الإجراء المنفذ: " + issue.repair_actions.trim());
  else if (issue.resolution?.trim()) lines.push("الحل المسجل: " + issue.resolution.trim());
  if (issue.verification_result?.trim()) lines.push("التحقق بعد الإصلاح: " + issue.verification_result.trim());
  if (issue.prevention_notes?.trim()) lines.push("التوصيات الوقائية: " + issue.prevention_notes.trim());

  return lines;
}
