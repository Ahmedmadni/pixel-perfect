import type { Vehicle } from "@/types/vehicle";
import {
  calculateMaintenanceStatus,
  sortByPriority,
  type MaintenanceEvaluation,
} from "../engine/engine";
import type { MaintenanceItem, Schedule } from "../services/maintenance.service";

export interface MaintenanceRow {
  vehicle: Vehicle;
  item: MaintenanceItem;
  schedule: Schedule | null;
  evaluation: MaintenanceEvaluation;
}

export function buildVehicleMaintenanceRows(
  vehicle: Vehicle,
  items: MaintenanceItem[],
  schedules: Schedule[],
  today?: string,
): MaintenanceRow[] {
  const byItem = new Map(schedules.filter((s) => s.vehicle_id === vehicle.id).map((s) => [s.maintenance_item_id, s]));

  return sortByPriority(
    items.map((item) => {
      const schedule = byItem.get(item.id) ?? null;
      const source = schedule ?? {
        interval_km: item.default_interval_km,
        interval_months: item.default_interval_months,
        last_service_date: null,
        last_service_odometer: null,
        is_enabled: true,
      };
      return {
        vehicle,
        item,
        schedule,
        evaluation: calculateMaintenanceStatus(source, vehicle.current_odometer, today),
      };
    }),
  );
}

export function buildMaintenanceRows(
  vehicles: Vehicle[],
  items: MaintenanceItem[],
  schedules: Schedule[],
  today?: string,
): MaintenanceRow[] {
  return vehicles.flatMap((vehicle) => buildVehicleMaintenanceRows(vehicle, items, schedules, today));
}
