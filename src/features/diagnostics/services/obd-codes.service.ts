import { requireClient, requireUserId, toDataError } from "@/lib/data-provider";
import { mergeObdCodes } from "../lib/obd-merge";

export type ObdCategory = "P" | "B" | "C" | "U";
export interface ObdFaultCode {
  code: string;
  /** Standard P/B/C/U or a user-defined category label. */
  category: string;
  description: string;
  custom?: boolean;
}
export interface UserObdCode {
  id: string;
  code: string;
  description: string;
  category: string;
  notes: string | null;
}

export const OBD_CATEGORY_LABELS: Record<ObdCategory, string> = {
  P: "المحرك وناقل الحركة",
  B: "الهيكل والكهرباء",
  C: "الشاسيه والفرامل",
  U: "شبكة الاتصالات",
};

export function categoryLabel(category: string): string {
  return OBD_CATEGORY_LABELS[category as ObdCategory] ?? category;
}

export const OBD_CODE_PATTERN = /^[PBCU][0-9A-F]{4}$/;
/** Custom codes allow any 3–12 letters/digits. */
export const CUSTOM_CODE_PATTERN = /^[A-Z0-9]{3,12}$/;

export function normalizeObdCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const COLS = "code,description,category";

/** Look up codes in the standard library plus the user's own codes (user wins). */
export async function lookupObdCodes(codes: string[]): Promise<ObdFaultCode[]> {
  const wanted = Array.from(new Set(codes.map(normalizeObdCode).filter(Boolean)));
  if (wanted.length === 0) return [];
  const client = requireClient();
  const [std, own] = await Promise.all([
    client.from("obd_fault_codes").select(COLS).in("code", wanted),
    client.from("user_obd_codes").select(COLS).in("code", wanted),
  ]);
  if (std.error) throw toDataError(std.error);
  if (own.error) throw toDataError(own.error);
  return mergeObdCodes(std.data ?? [], own.data ?? []);
}

/** Search both libraries by code prefix or description text. */
export async function searchObdCodes(term: string, limit = 12): Promise<ObdFaultCode[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const client = requireClient();
  const asCode = normalizeObdCode(q);
  const safe = q.replace(/[,()%]/g, " ");
  const filter = asCode ? `code.ilike.${asCode}%,description.ilike.%${safe}%` : `description.ilike.%${safe}%`;
  const [std, own] = await Promise.all([
    client.from("obd_fault_codes").select(COLS).or(filter).order("code").limit(limit),
    client.from("user_obd_codes").select(COLS).or(filter).order("code").limit(limit),
  ]);
  if (std.error) throw toDataError(std.error);
  if (own.error) throw toDataError(own.error);
  return mergeObdCodes(std.data ?? [], own.data ?? []).slice(0, limit);
}

export async function listUserObdCodes(): Promise<UserObdCode[]> {
  const { data, error } = await requireClient()
    .from("user_obd_codes").select("id,code,description,category,notes").order("code");
  if (error) throw toDataError(error);
  return data ?? [];
}

export async function countStandardCodes(): Promise<number> {
  const { count, error } = await requireClient().from("obd_fault_codes").select("code", { count: "exact", head: true });
  if (error) throw toDataError(error);
  return count ?? 0;
}

export async function saveUserObdCode(input: { id?: string | undefined; code: string; description: string; category: string; notes?: string | null | undefined }): Promise<void> {
  const client = requireClient();
  const user_id = await requireUserId(client);
  const row = {
    user_id,
    code: normalizeObdCode(input.code),
    description: input.description.trim(),
    category: input.category.trim(),
    notes: input.notes?.trim() || null,
  };
  const { error } = input.id
    ? await client.from("user_obd_codes").update(row).eq("id", input.id)
    : await client.from("user_obd_codes").upsert(row, { onConflict: "user_id,code" });
  if (error) throw toDataError(error);
}

export async function deleteUserObdCode(id: string): Promise<void> {
  const { error } = await requireClient().from("user_obd_codes").delete().eq("id", id);
  if (error) throw toDataError(error);
}
