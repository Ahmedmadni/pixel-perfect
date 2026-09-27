import type { DiagnosticIssue, DiagnosticSeverity, DiagnosticStatus } from "../services/diagnostics.service";

export const DIAGNOSTIC_STATUS_LABELS: Record<DiagnosticStatus, string> = {
  open: "مفتوح",
  monitoring: "تحت المراقبة",
  resolved: "تم الحل",
  returned: "عاد العطل",
};

export const DIAGNOSTIC_SEVERITY_LABELS: Record<DiagnosticSeverity, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "مرتفعة",
  critical: "حرجة",
};

const statusRank: Record<DiagnosticStatus, number> = {
  returned: 0,
  open: 1,
  monitoring: 2,
  resolved: 3,
};
const severityRank: Record<DiagnosticSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function summarizeDiagnostics(issues: Pick<DiagnosticIssue, "status" | "severity">[]) {
  return {
    total: issues.length,
    active: issues.filter((issue) => issue.status === "open" || issue.status === "monitoring" || issue.status === "returned").length,
    returned: issues.filter((issue) => issue.status === "returned").length,
    critical: issues.filter((issue) => issue.status !== "resolved" && issue.severity === "critical").length,
    resolved: issues.filter((issue) => issue.status === "resolved").length,
  };
}

export function sortDiagnostics<T extends Pick<DiagnosticIssue, "status" | "severity" | "first_detected_date">>(issues: T[]): T[] {
  return [...issues].sort((a, b) =>
    statusRank[a.status] - statusRank[b.status]
    || severityRank[a.severity] - severityRank[b.severity]
    || b.first_detected_date.localeCompare(a.first_detected_date),
  );
}
