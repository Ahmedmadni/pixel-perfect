import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export const INVOICE_BUCKET = "maintenance-documents";
const INVOICE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const INVOICE_MAX = 10 * 1024 * 1024;

export interface MaintenanceItem {
  id: string;
  category_id: string | null;
  user_id: string | null;
  name_ar: string;
  default_interval_km: number | null;
  default_interval_months: number | null;
  is_system: boolean;
  sort_order: number;
  category?: { name_ar: string } | null;
}
export interface Schedule {
  id: string;
  vehicle_id: string;
  maintenance_item_id: string;
  interval_km: number | null;
  interval_months: number | null;
  last_service_date: string | null;
  last_service_odometer: number | null;
  next_due_date: string | null;
  next_due_odometer: number | null;
  is_enabled: boolean;
  item: MaintenanceItem | null;
}
export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_item_id: string;
  service_date: string;
  odometer: number;
  parts_cost: number;
  labor_cost: number;
  other_cost: number;
  total_cost: number | null;
  workshop_name: string | null;
  technician_name: string | null;
  notes: string | null;
  invoice_url: string | null;
  created_at: string;
  item: { name_ar: string } | null;
  vehicle?: { name: string } | null;
}
export interface RecordInput {
  vehicle_id: string;
  maintenance_item_id: string;
  service_date: string;
  odometer: number;
  parts_cost: number;
  labor_cost: number;
  other_cost: number;
  workshop_name: string | null;
  technician_name: string | null;
  notes: string | null;
}

export async function getMaintenanceCategories() {
  const c = requireClient();
  const { data, error } = await c.from("maintenance_categories").select("id,name_ar,sort_order").eq("is_active", true).order("sort_order");
  if (error) throw toDataError(error);
  return data as { id: string; name_ar: string }[];
}

export async function getMaintenanceItems(): Promise<MaintenanceItem[]> {
  const c = requireClient();
  const { data, error } = await c.from("maintenance_items").select("*, category:maintenance_categories(name_ar)").order("sort_order");
  if (error) throw toDataError(error);
  return (data ?? []) as unknown as MaintenanceItem[];
}

export async function createCustomItem(input: { name_ar: string; category_id: string | null; default_interval_km: number | null; default_interval_months: number | null }) {
  const c = requireClient();
  const user_id = await requireUserId(c);
  if (!input.default_interval_km && !input.default_interval_months)
    throw new DataProviderError("VALIDATION_ERROR", "أدخل فترة بالكيلومتر أو بالأشهر على الأقل.");
  const { data, error } = await c.from("maintenance_items").insert({ ...input, user_id, is_system: false, sort_order: 999 }).select("*").single();
  if (error) throw toDataError(error);
  return data as MaintenanceItem;
}

export async function getVehicleSchedules(vehicleId?: string): Promise<Schedule[]> {
  const c = requireClient();
  let q = c.from("vehicle_maintenance_schedules").select("*, item:maintenance_items(*, category:maintenance_categories(name_ar))");
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  return (data ?? []) as unknown as Schedule[];
}

export async function upsertSchedule(input: { id?: string | undefined; vehicle_id: string; maintenance_item_id: string; interval_km: number | null; interval_months: number | null; is_enabled: boolean }) {
  const c = requireClient();
  if (input.interval_km != null && input.interval_km <= 0) throw new DataProviderError("VALIDATION_ERROR", "الفترة بالكيلومتر يجب أن تكون أكبر من صفر.");
  if (input.interval_months != null && input.interval_months <= 0) throw new DataProviderError("VALIDATION_ERROR", "الفترة بالأشهر يجب أن تكون أكبر من صفر.");
  if (input.is_enabled && input.interval_km == null && input.interval_months == null) {
    throw new DataProviderError("VALIDATION_ERROR", "أدخل فترة بالكيلومتر أو بالأشهر على الأقل.");
  }
  if (input.id) {
    const { data, error } = await c
      .from("vehicle_maintenance_schedules")
      .update({
        interval_km: input.interval_km,
        interval_months: input.interval_months,
        is_enabled: input.is_enabled,
      })
      .eq("id", input.id)
      .select("id")
      .maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
    return;
  }
  const user_id = await requireUserId(c);
  const { id: _id, ...rest } = input;
  const { error } = await c.from("vehicle_maintenance_schedules").insert({ ...rest, user_id });
  if (error) throw toDataError(error);
}

export async function getMaintenanceRecords(vehicleId?: string): Promise<MaintenanceRecord[]> {
  const c = requireClient();
  let q = c.from("maintenance_records").select("*, item:maintenance_items(name_ar), vehicle:vehicles(name)").order("service_date", { ascending: false }).order("created_at", { ascending: false });
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  return (data ?? []) as unknown as MaintenanceRecord[];
}

export function validateInvoice(file: File): string | null {
  if (!INVOICE_TYPES.includes(file.type)) return "الصيغ المسموحة: صورة JPG/PNG/WEBP أو PDF.";
  if (file.size > INVOICE_MAX) return "حجم الفاتورة يجب ألا يتجاوز 10 ميجابايت.";
  return null;
}

export function validateRecord(r: RecordInput): string | null {
  if (!r.maintenance_item_id) return "اختر نوع الصيانة.";
  if (!r.service_date) return "أدخل تاريخ الصيانة.";
  if (r.service_date > new Date().toISOString().slice(0, 10)) return "تاريخ الصيانة لا يمكن أن يكون في المستقبل.";
  if (!Number.isFinite(r.odometer) || r.odometer < 0) return "قراءة العداد غير صحيحة.";
  if ([r.parts_cost, r.labor_cost, r.other_cost].some((n) => !Number.isFinite(n) || n < 0)) return "التكاليف لا يمكن أن تكون سالبة.";
  return null;
}

export async function saveMaintenanceRecord(input: RecordInput, opts: { id?: string | undefined; invoice?: File | null | undefined; removeInvoice?: boolean | undefined; oldInvoice?: string | null }) {
  const invalid = validateRecord(input);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);
  if (opts.invoice) {
    const bad = validateInvoice(opts.invoice);
    if (bad) throw new DataProviderError("VALIDATION_ERROR", bad);
  }
  const c = requireClient();
  const user_id = await requireUserId(c);
  let id = opts.id;
  if (id) {
    const { data, error } = await c.from("maintenance_records").update(input).eq("id", id).select("id").maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
  } else {
    const { data, error } = await c.from("maintenance_records").insert({ ...input, user_id }).select("id").single();
    if (error) throw toDataError(error);
    id = data.id as string;
  }
  if (opts.invoice) {
    const ext = opts.invoice.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${user_id}/${input.vehicle_id}/${id}/${Date.now()}.${ext}`;
    const up = await c.storage.from(INVOICE_BUCKET).upload(path, opts.invoice, { contentType: opts.invoice.type });
    if (up.error) throw new DataProviderError("UNKNOWN", "تم حفظ السجل لكن تعذّر رفع الفاتورة.");
    const linked = await c.from("maintenance_records").update({ invoice_url: path }).eq("id", id).select("id").maybeSingle();
    if (linked.error || !linked.data) {
      await c.storage.from(INVOICE_BUCKET).remove([path]);
      if (linked.error) throw toDataError(linked.error);
      throw new DataProviderError("NOT_FOUND");
    }
    if (opts.oldInvoice) await c.storage.from(INVOICE_BUCKET).remove([opts.oldInvoice]);
  } else if (opts.removeInvoice && opts.oldInvoice) {
    const cleared = await c.from("maintenance_records").update({ invoice_url: null }).eq("id", id).select("id").maybeSingle();
    if (cleared.error) throw toDataError(cleared.error);
    if (!cleared.data) throw new DataProviderError("NOT_FOUND");
    await c.storage.from(INVOICE_BUCKET).remove([opts.oldInvoice]);
  }
  return id;
}

export async function deleteMaintenanceRecord(rec: Pick<MaintenanceRecord, "id" | "invoice_url">) {
  const c = requireClient();
  const { data, error } = await c.from("maintenance_records").delete().eq("id", rec.id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
  if (rec.invoice_url) await c.storage.from(INVOICE_BUCKET).remove([rec.invoice_url]);
}

export async function getInvoiceUrl(path: string) {
  const c = requireClient();
  const { data, error } = await c.storage.from(INVOICE_BUCKET).createSignedUrl(path, 300);
  if (error) throw toDataError(error);
  return data.signedUrl;
}
