import { useQuery } from "@tanstack/react-query";
import { lookupObdCodes, searchObdCodes } from "../services/obd-codes.service";

export const obdKeys = {
  root: ["obd-codes"] as const,
  lookup: (codes: string[]) => ["obd-codes", "lookup", [...codes].sort().join(",")] as const,
  search: (term: string) => ["obd-codes", "search", term] as const,
};

/** Descriptions for the codes already attached to an issue. */
export function useObdCodeLookup(codes: string[]) {
  return useQuery({
    queryKey: obdKeys.lookup(codes),
    queryFn: () => lookupObdCodes(codes),
    enabled: codes.length > 0,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
}

/** Live search over the fault-code library. */
export function useObdCodeSearch(term: string) {
  return useQuery({
    queryKey: obdKeys.search(term.trim()),
    queryFn: () => searchObdCodes(term),
    enabled: term.trim().length >= 2,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
}
