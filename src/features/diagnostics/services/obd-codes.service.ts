import { requireClient, toDataError } from "@/lib/data-provider";

export type ObdCategory = "P" | "B" | "C" | "U";
export interface ObdFaultCode {
  code: string;
  description: string;
  category: ObdCategory;
}

export const OBD_CATEGORY_LABELS: Record<ObdCategory, string> = {
  P: "المحرك وناقل الحركة",
  B: "الهيكل والكهرباء",
  C: "الشاسيه والفرامل",
  U: "شبكة الاتصالات",
};

export const OBD_CODE_PATTERN = /^[PBCU][0-9A-F]{4}$/;

export function normalizeObdCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Look up the official description of specific fault codes. */
export async function lookupObdCodes(codes: string[]): Promise<ObdFaultCode[]> {
  const wanted = Array.from(new Set(codes.map(normalizeObdCode).filter(Boolean)));
  if (wanted.length === 0) return [];
  const { data, error } = await requireClient()
    .from("obd_fault_codes")
    .select("code,description,category")
    .in("code", wanted);
  if (error) throw toDataError(error);
  return (data ?? []) as ObdFaultCode[];
}

/** Search the fault-code library by code prefix or description text. */
export async function searchObdCodes(term: string, limit = 12): Promise<ObdFaultCode[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const client = requireClient();
  const asCode = normalizeObdCode(q);
  const filter = /^[PBCU]/.test(asCode)
    ? `code.ilike.${asCode}%,description.ilike.%${q}%`
    : `description.ilike.%${q}%`;
  const { data, error } = await client
    .from("obd_fault_codes")
    .select("code,description,category")
    .or(filter)
    .order("code")
    .limit(limit);
  if (error) throw toDataError(error);
  return (data ?? []) as ObdFaultCode[];
}
