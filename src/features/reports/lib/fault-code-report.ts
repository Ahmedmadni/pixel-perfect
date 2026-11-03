import type { DiagnosticIssue } from "@/features/diagnostics/services/diagnostics.service";
import type { ObdFaultCode } from "@/features/diagnostics/services/obd-codes.service";

export interface FaultCodeRow {
  code: string;
  description: string | null;
  category: string;
  occurrences: number;
  activeOccurrences: number;
  firstSeen: string;
  lastSeen: string;
  issueTitles: string[];
}

/** Aggregates OBD-II codes recorded on one vehicle's diagnostic issues. */
export function buildFaultCodeReport(vehicleId: string, issues: DiagnosticIssue[], catalog: ObdFaultCode[]): FaultCodeRow[] {
  const byCode = new Map<string, FaultCodeRow>();
  for (const issue of issues) {
    if (issue.vehicle_id !== vehicleId) continue;
    const active = issue.status !== "resolved";
    for (const raw of new Set(issue.obd_codes.map(c => c.trim().toUpperCase()).filter(Boolean))) {
      const known = catalog.find(c => c.code === raw);
      const row = byCode.get(raw) ?? { code: raw, description: known?.description ?? null, category: known?.category ?? raw[0] ?? "?", occurrences: 0, activeOccurrences: 0, firstSeen: issue.first_detected_date, lastSeen: issue.first_detected_date, issueTitles: [] };
      row.occurrences += 1;
      if (active) row.activeOccurrences += 1;
      if (issue.first_detected_date < row.firstSeen) row.firstSeen = issue.first_detected_date;
      if (issue.first_detected_date > row.lastSeen) row.lastSeen = issue.first_detected_date;
      row.issueTitles.push(issue.title);
      byCode.set(raw, row);
    }
  }
  return [...byCode.values()].sort((a, b) => b.activeOccurrences - a.activeOccurrences || b.occurrences - a.occurrences || b.lastSeen.localeCompare(a.lastSeen));
}
