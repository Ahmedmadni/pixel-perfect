import type { DiagnosticIssue } from "@/features/diagnostics/services/diagnostics.service";
import { calculateMaintenanceStatus, rebuildFromRecords } from "@/features/maintenance/engine/engine";
import type { MaintenanceItem, MaintenanceRecord, Schedule } from "@/features/maintenance/services/maintenance.service";
import type { Symptom } from "../services/symptoms.service";
import { rankCauses } from "./symptom-rules";

export interface HistoryContext {
  vehicleId: string;
  currentOdometer: number;
  symptoms: Symptom[];
  items: MaintenanceItem[];
  schedules: Schedule[];
  records: MaintenanceRecord[];
  issues: DiagnosticIssue[];
  today?: string;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F\u0640]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

/** Text matches are suggestions; recorded maintenance links are explicit evidence. */
export function linkSymptomHistory(context: HistoryContext) {
  const { vehicleId, currentOdometer, symptoms, items } = context;
  const today = context.today ?? new Date().toISOString().slice(0, 10);
  const records = context.records.filter((r) => r.vehicle_id === vehicleId);
  const schedules = context.schedules.filter((s) => s.vehicle_id === vehicleId);
  const issues = context.issues.filter((i) => i.vehicle_id === vehicleId);
  return symptoms.map((symptom) => {
    const name = normalize(symptom.name);
    const itemIds = new Set(symptom.causes.map((c) => c.maintenance_item_id).filter((id) => id != null));
    const relatedRecords = records.filter((r) => itemIds.has(r.maintenance_item_id))
      .sort((a, b) => b.service_date.localeCompare(a.service_date) || b.odometer - a.odometer || b.created_at.localeCompare(a.created_at));
    const relatedRecordIds = new Set(relatedRecords.map((r) => r.id));
    const linkedIssues = issues.filter((issue) =>
      (name.length >= 3 && normalize(`${issue.title} ${issue.symptoms ?? ""}`).includes(name)) ||
      (issue.maintenance_record_id != null && relatedRecordIds.has(issue.maintenance_record_id)),
    );
    const activeIssues = linkedIssues.filter((i) => i.status !== "resolved");
    const effectiveSchedules = items.map((item) => {
      const schedule = schedules.find((s) => s.maintenance_item_id === item.id);
      const history = rebuildFromRecords(records.filter((r) => r.maintenance_item_id === item.id));
      const source = {
        interval_km: schedule ? schedule.interval_km : item.default_interval_km,
        interval_months: schedule ? schedule.interval_months : item.default_interval_months,
        last_service_odometer: history.last_service_odometer ?? schedule?.last_service_odometer ?? null,
        last_service_date: history.last_service_date ?? schedule?.last_service_date ?? null,
        is_enabled: schedule?.is_enabled ?? true,
      };
      const evaluation = calculateMaintenanceStatus(source, currentOdometer, today);
      return { maintenance_item_id: item.id, ...source, ...evaluation };
    });
    const ranked = rankCauses(symptom.causes, effectiveSchedules, currentOdometer,
      (id) => items.find((i) => i.id === id)?.name_ar ?? "صيانة", today);
    const dueCauses = ranked.filter(({ cause }) => {
      const s = effectiveSchedules.find((x) => x.maintenance_item_id === cause.maintenance_item_id);
      if (!s || !s.is_enabled) return false;
      return s.status === "DUE" || s.status === "OVERDUE" ||
        (cause.km_threshold != null && s.last_service_odometer != null &&
          currentOdometer - s.last_service_odometer >= cause.km_threshold);
    });
    return { symptom, ranked, relatedRecords, linkedIssues, activeIssues, dueCauses,
      maintenanceDue: activeIssues.length > 0 && dueCauses.length > 0 };
  });
}

export type SymptomHistoryLink = ReturnType<typeof linkSymptomHistory>[number];