import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getObdCodePartLinks, linkPartToCode, unlinkPartFromCode } from "@/features/parts/services/obd-code-parts.service";

const key = ["obd-code-parts"] as const;

export function useObdCodePartLinks() {
  return useQuery({ queryKey: key, queryFn: getObdCodePartLinks, retry: false });
}
export function useLinkPartToCode() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { code: string; partId: string }) => linkPartToCode(v.code, v.partId), onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}
export function useUnlinkPart() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => unlinkPartFromCode(id), onSuccess: () => qc.invalidateQueries({ queryKey: key }) });
}
