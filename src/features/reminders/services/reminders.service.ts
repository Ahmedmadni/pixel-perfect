import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export type ReminderType = "registration" | "insurance" | "inspection" | "maintenance" | "document" | "custom";
export type ReminderStatus = "active" | "completed" | "dismissed";

export interface Reminder {
  id: string;
  vehicle_id: string;
  title: string;
  reminder_type: ReminderType;
  due_date: string | null;
  due_odometer: number | null;
  recurring_months: number | null;
  recurring_km: number | null;
  status: ReminderStatus;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  vehicle?: { name: string; current_odometer: number } | null;
}

export interface ReminderInput {
  vehicle_id: string;
  title: string;
  reminder_type: ReminderType;
  due_date: string | null;
  due_odometer: number | null;
  recurring_months: number | null;
  recurring_km: number | null;
  notes: string | null;
}

export async function getReminders(vehicleId?: string): Promise<Reminder[]> {
  const c = requireClient();
  let q = c
    .from("reminders")
    .select("*, vehicle:vehicles(name,current_odometer)")
    .order("status")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  return (data ?? []) as unknown as Reminder[];
}

export function validateReminder(input: ReminderInput): string | null {
  if (!input.vehicle_id) return "اختر السيارة.";
  if (!input.title.trim()) return "عنوان التذكير مطلوب.";
  if (input.due_date == null && input.due_odometer == null) return "حدد تاريخًا أو عدادًا للاستحقاق.";
  if (input.due_odometer != null && (!Number.isFinite(input.due_odometer) || input.due_odometer < 0)) return "عداد الاستحقاق غير صحيح.";
  if (input.recurring_months != null && input.recurring_months <= 0) return "التكرار بالأشهر يجب أن يكون أكبر من صفر.";
  if (input.recurring_km != null && input.recurring_km <= 0) return "التكرار بالكيلومتر يجب أن يكون أكبر من صفر.";
  return null;
}

export async function saveReminder(input: ReminderInput, id?: string) {
  const bad = validateReminder(input);
  if (bad) throw new DataProviderError("VALIDATION_ERROR", bad);
  const c = requireClient();
  const user_id = await requireUserId(c);

  if (id) {
    const { data, error } = await c
      .from("reminders")
      .update({ ...input, status: "active" })
      .eq("id", id)
      .is("document_id", null)
      .select("id")
      .maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
    return id;
  }

  const { data, error } = await c
    .from("reminders")
    .insert({ ...input, user_id, status: "active" })
    .select("id")
    .single();
  if (error) throw toDataError(error);
  return data.id as string;
}

export async function setReminderStatus(id: string, status: ReminderStatus) {
  const c = requireClient();
  const { data, error } = await c
    .from("reminders")
    .update({ status })
    .eq("id", id)
    .is("document_id", null)
    .select("id")
    .maybeSingle();
  if (error) throw toDataError(error);
  if (!data) throw new DataProviderError("VALIDATION_ERROR", "تذكيرات المستندات تُدار من المستند نفسه.");
}

export async function deleteReminder(id: string) {
  const c = requireClient();
  const { data, error } = await c.from("reminders").delete().eq("id", id).is("document_id", null).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("VALIDATION_ERROR", "تذكيرات المستندات تُحذف بحذف المستند.");
}
