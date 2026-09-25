import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VehicleInput } from "@/types/vehicle";
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle,
} from "../services/vehicles.service";

export const vehicleKeys = {
  all: ["vehicles"] as const,
  detail: (id: string) => ["vehicles", id] as const,
};

const noRetry = { retry: false } as const;

export function useVehicles() {
  return useQuery({ queryKey: vehicleKeys.all, queryFn: getVehicles, ...noRetry });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: () => getVehicleById(id),
    ...noRetry,
  });
}

export function useSaveVehicle(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInput) => (id ? updateVehicle(id, input) : createVehicle(input)),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: vehicleKeys.all });
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(v.id) });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}
