import { useQuery } from "@tanstack/react-query";
import { useDiagnosticIssues } from "@/features/diagnostics/hooks/useDiagnostics";
import { useMaintenanceItems, useMaintenanceRecords, useMaintenanceSchedules } from "@/features/maintenance/hooks/useMaintenance";
import type { Vehicle } from "@/types/vehicle";
import { getSymptoms } from "../services/symptoms.service";
import { linkSymptomHistory } from "../lib/history-links";

export function useSymptomHistory(vehicle: Vehicle | undefined) {
  const symptomsQ = useQuery({ queryKey: ["symptoms"], queryFn: getSymptoms, retry: false });
  const itemsQ = useMaintenanceItems();
  const schedulesQ = useMaintenanceSchedules(vehicle?.id);
  const recordsQ = useMaintenanceRecords(vehicle?.id);
  const issuesQ = useDiagnosticIssues(vehicle?.id);
  const queries = [symptomsQ, itemsQ, schedulesQ, recordsQ, issuesQ];
  const links = vehicle ? linkSymptomHistory({
    vehicleId: vehicle.id, currentOdometer: vehicle.current_odometer,
    symptoms: symptomsQ.data ?? [], items: itemsQ.data ?? [], schedules: schedulesQ.data ?? [],
    records: recordsQ.data ?? [], issues: issuesQ.data ?? [],
  }) : [];
  return { links, symptoms: symptomsQ.data ?? [], items: itemsQ.data ?? [],
    isPending: queries.some((q) => q.isPending), error: queries.find((q) => q.error)?.error,
    refetch: () => { queries.forEach((q) => { void q.refetch(); }); } };
}