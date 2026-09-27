import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePart,
  deletePartInstallation,
  deletePartPrice,
  deleteSupplier,
  getPartInstallations,
  getParts,
  getSuppliers,
  savePart,
  savePartInstallation,
  savePartPrice,
  saveSupplier,
  type Part,
  type PartInput,
  type PartInstallation,
  type PartInstallationInput,
  type PartPriceInput,
  type Supplier,
} from "../services/parts.service";

export const partKeys = {
  root: ["parts"] as const,
  list: (vehicleId?: string) => ["parts", "list", vehicleId ?? "all"] as const,
  suppliers: ["parts", "suppliers"] as const,
  installations: (vehicleId?: string) => ["parts", "installations", vehicleId ?? "all"] as const,
};

const noRetry = { retry: false } as const;

export function useParts(vehicleId?: string) {
  return useQuery({ queryKey: partKeys.list(vehicleId), queryFn: () => getParts(vehicleId), ...noRetry });
}
export function useSuppliers() {
  return useQuery({ queryKey: partKeys.suppliers, queryFn: getSuppliers, ...noRetry });
}
export function usePartInstallations(vehicleId?: string) {
  return useQuery({ queryKey: partKeys.installations(vehicleId), queryFn: () => getPartInstallations(vehicleId), ...noRetry });
}

function invalidateParts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: partKeys.root });
  qc.invalidateQueries({ queryKey: ["expenses"] });
}

export function useSavePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: PartInput; opts: { id?: string; image?: File | null; removeImage?: boolean; oldImage?: string | null } }) =>
      savePart(args.input, args.opts),
    onSuccess: () => invalidateParts(qc),
  });
}
export function useDeletePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (part: Pick<Part, "id" | "image_url">) => deletePart(part),
    onSuccess: () => invalidateParts(qc),
  });
}
export function useSaveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: Omit<Supplier, "id">; id?: string }) => saveSupplier(args.input, args.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: partKeys.suppliers }),
  });
}
export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: partKeys.suppliers }),
  });
}
export function useSavePartPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: PartPriceInput; id?: string }) => savePartPrice(args.input, args.id),
    onSuccess: () => invalidateParts(qc),
  });
}
export function useDeletePartPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePartPrice,
    onSuccess: () => invalidateParts(qc),
  });
}
export function useSavePartInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: PartInstallationInput; opts: { id?: string; receipt?: File | null; removeReceipt?: boolean; oldReceipt?: string | null } }) =>
      savePartInstallation(args.input, args.opts),
    onSuccess: () => invalidateParts(qc),
  });
}
export function useDeletePartInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (installation: Pick<PartInstallation, "id" | "receipt_url">) => deletePartInstallation(installation),
    onSuccess: () => invalidateParts(qc),
  });
}
