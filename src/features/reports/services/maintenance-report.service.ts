import { queryOptions } from "@tanstack/react-query";
import { getVehicles } from "@/features/vehicles/services/vehicles.service";
import { getMaintenanceRecords } from "@/features/maintenance/services/maintenance.service";
import { getDiagnosticIssues } from "@/features/diagnostics/services/diagnostics.service";
import { lookupObdCodes } from "@/features/diagnostics/services/obd-codes.service";
import { getParts, getPartInstallations } from "@/features/parts/services/parts.service";

export async function getMaintenanceReportData() {
  const [vehicles, records, issues, parts, installations] = await Promise.all([
    getVehicles(), getMaintenanceRecords(), getDiagnosticIssues(), getParts(), getPartInstallations(),
  ]);
  const codes = await lookupObdCodes(issues.flatMap(issue => issue.obd_codes));
  return { vehicles, records, issues, parts, installations, codes };
}
export const maintenanceReportQuery = queryOptions({ queryKey: ["comprehensive-maintenance-report"], queryFn: getMaintenanceReportData, staleTime: 0, retry: false });