import { DataProviderError, requireClient, toDataError } from "@/lib/data-provider";

export type Likelihood = "low" | "medium" | "high";
export interface SymptomCause {
  id: string; symptom_id: string; cause: string; maintenance_item_id: string | null;
  km_threshold: number | null; base_likelihood: Likelihood; steps: string | null;
}
export interface Symptom { id: string; name: string; description: string | null; category: string | null; causes: SymptomCause[]; }
export type SymptomInput = { name: string; description: string | null; category: string | null };
export type CauseInput = Omit<SymptomCause, "id">;

export async function getSymptoms(): Promise<Symptom[]> {
  const { data, error } = await requireClient().from("car_symptoms").select("id,name,description,category,causes:symptom_causes(*)").order("name");
  if (error) throw toDataError(error);
  return ((data ?? []) as unknown as Symptom[]).map((s) => ({ ...s, causes: s.causes ?? [] }));
}
export async function saveSymptom(input: SymptomInput, id?: string) {
  if (!input.name.trim()) throw new DataProviderError("VALIDATION_ERROR", "اسم العرض مطلوب.");
  const c = requireClient();
  const { error } = id ? await c.from("car_symptoms").update(input).eq("id", id) : await c.from("car_symptoms").insert(input);
  if (error) throw toDataError(error);
}
export async function deleteSymptom(id: string) {
  const { error } = await requireClient().from("car_symptoms").delete().eq("id", id);
  if (error) throw toDataError(error);
}
export async function saveCause(input: CauseInput, id?: string) {
  if (!input.cause.trim()) throw new DataProviderError("VALIDATION_ERROR", "اكتب السبب.");
  if (input.km_threshold != null && !(input.km_threshold > 0)) throw new DataProviderError("VALIDATION_ERROR", "حد الكيلومترات يجب أن يكون أكبر من صفر.");
  const c = requireClient();
  const { error } = id ? await c.from("symptom_causes").update(input).eq("id", id) : await c.from("symptom_causes").insert(input);
  if (error) throw toDataError(error);
}
export async function deleteCause(id: string) {
  const { error } = await requireClient().from("symptom_causes").delete().eq("id", id);
  if (error) throw toDataError(error);
}
