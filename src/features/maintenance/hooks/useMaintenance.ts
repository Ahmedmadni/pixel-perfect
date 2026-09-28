import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehicleKeys } from "@/features/vehicles/hooks/useVehicles";
import {
  createCustomItem,
  deleteMaintenanceRecord,
  getMaintenanceCategories,
  getMaintenanceItems,
  getMaintenanceRecords,
  getVehicleSchedules,
  saveMaintenanceRecord,
  upsertSchedule,
  type MaintenanceRecord,
  type RecordInput,
} from "../services/maintenance.service";

export const maintenanceKeys = {
  root: ["maintenance"] as const,
  categories: ["maintenance", "categories"] as const,
  items: ["maintenance", "items"] as const,
  schedules: (vehicleId?: string) => ["maintenance", "schedules", vehicleId ?? "all"] as const,
  records: (vehicleId?: string) => ["maintenance", "records", vehicleId ?? "all"] as const,
};

const noRetry = { retry: false } as const;

export function useMaintenanceCategories() {
  return useQuery({ queryKey: maintenanceKeys.categories, queryFn: getMaintenanceCategories, ...noRetry });
}

export function useMaintenanceItems() {
  return useQuery({ queryKey: maintenanceKeys.items, queryFn: getMaintenanceItems, ...noRetry });
}

export function useMaintenanceSchedules(vehicleId?: string) {
  return useQuery({
    queryKey: maintenanceKeys.schedules(vehicleId),
    queryFn: () => getVehicleSchedules(vehicleId),
    ...noRetry,
  });
}

export function useMaintenanceRecords(vehicleId?: string) {
  return useQuery({
    queryKey: maintenanceKeys.records(vehicleId),
    queryFn: () => getMaintenanceRecords(vehicleId),
    ...noRetry,
  });
}

function invalidateMaintenance(qc: ReturnType<typeof useQueryClient>, vehicleId?: string) {
  qc.invalidateQueries({ queryKey: maintenanceKeys.root });
  qc.invalidateQueries({ queryKey: vehicleKeys.all });
  if (vehicleId) qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
}

function invalidateExpenseLedger(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["expenses"] });
}

export function useSaveMaintenanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      input: RecordInput;
      opts: { id?: string | undefined; invoice?: File | null | undefined; removeInvoice?: boolean | undefined; oldInvoice?: string | null };
    }) => saveMaintenanceRecord(args.input, args.opts),
    onSuccess: (_id, args) => {
      invalidateMaintenance(qc, args.input.vehicle_id);
      invalidateExpenseLedger(qc);
    },
  });
}

export function useDeleteMaintenanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rec: Pick<MaintenanceRecord, "id" | "invoice_url" | "vehicle_id">) => deleteMaintenanceRecord(rec),
    onSuccess: (_v, rec) => {
      invalidateMaintenance(qc, rec.vehicle_id);
      invalidateExpenseLedger(qc);
    },
  });
}

export function useUpsertMaintenanceSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertSchedule,
    onSuccess: (_v, input) => invalidateMaintenance(qc, input.vehicle_id),
  });
}

export function useCreateCustomMaintenanceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCustomItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.items }),
  });
}
