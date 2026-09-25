import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OdometerReadingInput } from "@/types/vehicle";
import { vehicleKeys } from "@/features/vehicles/hooks/useVehicles";
import { createOdometerReading, getOdometerReadings } from "../services/odometer.service";

export const odometerKeys = {
  byVehicle: (vehicleId: string) => ["odometer", vehicleId] as const,
};

export function useOdometerReadings(vehicleId: string) {
  return useQuery({
    queryKey: odometerKeys.byVehicle(vehicleId),
    queryFn: () => getOdometerReadings(vehicleId),
    retry: false,
  });
}

export function useCreateOdometerReading(vehicleId: string, currentOdometer: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OdometerReadingInput) => createOdometerReading(input, currentOdometer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: odometerKeys.byVehicle(vehicleId) });
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}
