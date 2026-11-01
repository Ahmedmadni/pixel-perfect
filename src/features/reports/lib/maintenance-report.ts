import type { MaintenanceRecord } from "@/features/maintenance/services/maintenance.service";
import type { PartInstallation } from "@/features/parts/services/parts.service";
import type { DiagnosticIssue } from "@/features/diagnostics/services/diagnostics.service";

export function serviceCost(record: MaintenanceRecord) {
  return Number(record.total_cost ?? (Number(record.parts_cost) + Number(record.labor_cost) + Number(record.other_cost)));
}
export function installationCost(row: PartInstallation) {
  return Number(row.total_cost ?? (Number(row.quantity) * Number(row.unit_price) + Number(row.other_cost)));
}
export function buildMaintenanceReport(vehicleId: string, records: MaintenanceRecord[], issues: DiagnosticIssue[], installations: PartInstallation[]) {
  const services = records.filter(r => r.vehicle_id === vehicleId).sort((a,b) => b.service_date.localeCompare(a.service_date));
  const faults = issues.filter(r => r.vehicle_id === vehicleId).sort((a,b) => b.first_detected_date.localeCompare(a.first_detected_date));
  const parts = installations.filter(r => r.vehicle_id === vehicleId).sort((a,b) => b.install_date.localeCompare(a.install_date));
  const serviceIds = new Set(services.map(r => r.id));
  const linkedParts = parts.filter(r => r.maintenance_record_id && serviceIds.has(r.maintenance_record_id));
  const independentParts = parts.filter(r => !r.maintenance_record_id || !serviceIds.has(r.maintenance_record_id));
  const maintenanceCost = services.reduce((sum,r) => sum + serviceCost(r),0);
  const independentPartsCost = independentParts.reduce((sum,r) => sum + installationCost(r),0);
  return { services, faults, parts, codes: [...new Set(faults.flatMap(r => r.obd_codes))].sort(), maintenanceCost, independentPartsCost,
    linkedPartsCost: linkedParts.reduce((sum,r) => sum + installationCost(r),0), total: maintenanceCost + independentPartsCost };
}