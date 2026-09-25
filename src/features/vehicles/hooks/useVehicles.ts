import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Vehicle, VehicleInput } from "@/types/vehicle";
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicleImageUrl,
  getVehicles,
  removeVehicleImage,
  setActiveVehicle,
  updateVehicle,
  uploadVehicleImage,
} from "../services/vehicles.service";

export const vehicleKeys = {
  all: ["vehicles"] as const,
  detail: (id: string) => ["vehicles", id] as const,
  image: (path: string) => ["vehicle-image", path] as const,
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

export function useSetActiveVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setActiveVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useVehicleImage(vehicle: Vehicle) {
  const qc = useQueryClient();
  const onSuccess = (v: Vehicle) => {
    qc.setQueryData(vehicleKeys.detail(v.id), v);
    qc.invalidateQueries({ queryKey: vehicleKeys.all });
  };
  return {
    upload: useMutation({ mutationFn: (file: File) => uploadVehicleImage(vehicle, file), onSuccess }),
    remove: useMutation({ mutationFn: () => removeVehicleImage(vehicle), onSuccess }),
  };
}

export function useVehicleImageUrl(path: string | null) {
  return useQuery({
    queryKey: vehicleKeys.image(path ?? ""),
    queryFn: () => getVehicleImageUrl(path!),
    enabled: !!path,
    staleTime: 30 * 60 * 1000,
    ...noRetry,
  });
}
