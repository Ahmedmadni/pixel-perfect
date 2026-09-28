import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export const PART_DOCUMENT_BUCKET = "part-documents";
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FILE_MAX = 10 * 1024 * 1024;

export type PartStatus = "researching" | "found" | "purchased" | "installed" | "archived";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
}

export interface PartPrice {
  id: string;
  part_id: string;
  supplier_id: string | null;
  price: number;
  observed_date: string;
  purchase_url: string | null;
  notes: string | null;
  supplier: { id: string; name: string } | null;
}

export interface Part {
  id: string;
  name_ar: string;
  name_en: string | null;
  part_number: string | null;
  oem_part_number: string | null;
  manufacturer: string | null;
  is_oem: boolean;
  status: PartStatus;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  fitments: { vehicle_id: string }[];
  prices: PartPrice[];
}

export interface PartInstallation {
  id: string;
  part_id: string;
  vehicle_id: string;
  supplier_id: string | null;
  maintenance_record_id: string | null;
  install_date: string;
  odometer: number | null;
  quantity: number;
  unit_price: number;
  other_cost: number;
  total_cost: number;
  receipt_url: string | null;
  notes: string | null;
  part: { name_ar: string; part_number: string | null } | null;
  vehicle?: { name: string } | null;
  supplier: { name: string } | null;
}

export interface PartInput {
  name_ar: string;
  name_en: string | null;
  part_number: string | null;
  oem_part_number: string | null;
  manufacturer: string | null;
  is_oem: boolean;
  status: PartStatus;
  notes: string | null;
  vehicle_ids: string[];
}

export interface PartPriceInput {
  part_id: string;
  supplier_id: string | null;
  price: number;
  observed_date: string;
  purchase_url: string | null;
  notes: string | null;
}

export interface PartInstallationInput {
  part_id: string;
  vehicle_id: string;
  supplier_id: string | null;
  maintenance_record_id: string | null;
  install_date: string;
  odometer: number | null;
  quantity: number;
  unit_price: number;
  other_cost: number;
  notes: string | null;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const c = requireClient();
  const { data, error } = await c.from("suppliers").select("*").order("name");
  if (error) throw toDataError(error);
  return (data ?? []) as Supplier[];
}

export async function saveSupplier(input: Omit<Supplier, "id">, id?: string): Promise<string> {
  const c = requireClient();
  const user_id = await requireUserId(c);
  if (!input.name.trim()) throw new DataProviderError("VALIDATION_ERROR", "اسم المورد مطلوب.");
  if (id) {
    const { data, error } = await c.from("suppliers").update(input).eq("id", id).select("id").maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
    return id;
  }
  const { data, error } = await c.from("suppliers").insert({ ...input, user_id }).select("id").single();
  if (error) throw toDataError(error);
  return data.id as string;
}

export async function deleteSupplier(id: string) {
  const c = requireClient();
  const { data, error } = await c.from("suppliers").delete().eq("id", id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
}

export async function getParts(vehicleId?: string): Promise<Part[]> {
  const c = requireClient();
  const { data, error } = await c
    .from("parts")
    .select("*, fitments:part_vehicle_fitments(vehicle_id), prices:part_prices(*, supplier:suppliers(id,name))")
    .order("created_at", { ascending: false });
  if (error) throw toDataError(error);
  const parts = (data ?? []) as unknown as Part[];
  return vehicleId ? parts.filter((part) => part.fitments.some((fitment) => fitment.vehicle_id === vehicleId)) : parts;
}

function validatePart(input: PartInput): string | null {
  if (!input.name_ar.trim()) return "اسم القطعة مطلوب.";
  if (!input.vehicle_ids.length) return "اختر سيارة متوافقة واحدة على الأقل.";
  return null;
}

function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "صورة القطعة يجب أن تكون JPG أو PNG أو WEBP.";
  if (file.size > FILE_MAX) return "حجم الصورة يجب ألا يتجاوز 10 ميجابايت.";
  return null;
}

export async function savePart(
  input: PartInput,
  opts: { id?: string | undefined; image?: File | null | undefined; removeImage?: boolean | undefined; oldImage?: string | null },
) {
  const invalid = validatePart(input);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);
  if (opts.image) {
    const bad = validateImage(opts.image);
    if (bad) throw new DataProviderError("VALIDATION_ERROR", bad);
  }

  const c = requireClient();
  const user_id = await requireUserId(c);
  const { vehicle_ids, ...partData } = input;
  let id = opts.id;

  if (id) {
    const { data, error } = await c.from("parts").update(partData).eq("id", id).select("id").maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
  } else {
    const { data, error } = await c.from("parts").insert({ ...partData, user_id }).select("id").single();
    if (error) throw toDataError(error);
    id = data.id as string;
  }

  const { error: fitmentDeleteError } = await c.from("part_vehicle_fitments").delete().eq("part_id", id);
  if (fitmentDeleteError) throw toDataError(fitmentDeleteError);
  if (vehicle_ids.length) {
    const { error: fitmentError } = await c.from("part_vehicle_fitments").insert(
      vehicle_ids.map((vehicle_id) => ({ part_id: id, vehicle_id, user_id })),
    );
    if (fitmentError) throw toDataError(fitmentError);
  }

  if (opts.image) {
    const ext = opts.image.name.split(".").pop()?.toLowerCase() || "bin";
    const path = [user_id, "parts", id, String(Date.now()) + "." + ext].join("/");
    const upload = await c.storage.from(PART_DOCUMENT_BUCKET).upload(path, opts.image, { contentType: opts.image.type });
    if (upload.error) throw new DataProviderError("UNKNOWN", "تم حفظ القطعة لكن تعذّر رفع الصورة.");
    const linked = await c.from("parts").update({ image_url: path }).eq("id", id).select("id").maybeSingle();
    if (linked.error || !linked.data) {
      await c.storage.from(PART_DOCUMENT_BUCKET).remove([path]);
      if (linked.error) throw toDataError(linked.error);
      throw new DataProviderError("NOT_FOUND");
    }
    if (opts.oldImage) await c.storage.from(PART_DOCUMENT_BUCKET).remove([opts.oldImage]);
  } else if (opts.removeImage && opts.oldImage) {
    const cleared = await c.from("parts").update({ image_url: null }).eq("id", id).select("id").maybeSingle();
    if (cleared.error) throw toDataError(cleared.error);
    if (!cleared.data) throw new DataProviderError("NOT_FOUND");
    await c.storage.from(PART_DOCUMENT_BUCKET).remove([opts.oldImage]);
  }

  return id;
}

export async function deletePart(part: Pick<Part, "id" | "image_url">) {
  const c = requireClient();
  const { data: installationDocs, error: installationError } = await c
    .from("part_installations")
    .select("receipt_url")
    .eq("part_id", part.id);
  if (installationError) throw toDataError(installationError);

  const { data, error } = await c.from("parts").delete().eq("id", part.id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");

  const paths = [
    ...(part.image_url ? [part.image_url] : []),
    ...((installationDocs ?? []).map((row) => row.receipt_url).filter(Boolean) as string[]),
  ];
  if (paths.length) await c.storage.from(PART_DOCUMENT_BUCKET).remove(paths);
}

export function validatePrice(input: PartPriceInput): string | null {
  if (!input.part_id) return "اختر القطعة.";
  if (!Number.isFinite(input.price) || input.price <= 0) return "السعر يجب أن يكون أكبر من صفر.";
  if (!input.observed_date) return "أدخل تاريخ السعر.";
  return null;
}

export async function savePartPrice(input: PartPriceInput, id?: string) {
  const bad = validatePrice(input);
  if (bad) throw new DataProviderError("VALIDATION_ERROR", bad);
  const c = requireClient();
  const user_id = await requireUserId(c);
  if (id) {
    const { data, error } = await c.from("part_prices").update(input).eq("id", id).select("id").maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
    return id;
  }
  const { data, error } = await c.from("part_prices").insert({ ...input, user_id }).select("id").single();
  if (error) throw toDataError(error);
  return data.id as string;
}

export async function deletePartPrice(id: string) {
  const c = requireClient();
  const { data, error } = await c.from("part_prices").delete().eq("id", id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
}

export async function getPartInstallations(vehicleId?: string): Promise<PartInstallation[]> {
  const c = requireClient();
  let q = c
    .from("part_installations")
    .select("*, part:parts(name_ar,part_number), vehicle:vehicles(name), supplier:suppliers(name)")
    .order("install_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  return (data ?? []) as unknown as PartInstallation[];
}

function validateInstallation(input: PartInstallationInput): string | null {
  if (!input.part_id) return "اختر القطعة.";
  if (!input.vehicle_id) return "اختر السيارة.";
  if (!input.install_date) return "أدخل تاريخ التركيب.";
  if (input.odometer != null && (!Number.isFinite(input.odometer) || input.odometer < 0)) return "قراءة العداد غير صحيحة.";
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) return "الكمية يجب أن تكون أكبر من صفر.";
  if (!Number.isFinite(input.unit_price) || input.unit_price < 0) return "سعر الوحدة غير صحيح.";
  if (!Number.isFinite(input.other_cost) || input.other_cost < 0) return "التكلفة الإضافية غير صحيحة.";
  return null;
}

function validateDocument(file: File): string | null {
  if (!FILE_TYPES.includes(file.type)) return "الصيغ المسموحة: JPG/PNG/WEBP أو PDF.";
  if (file.size > FILE_MAX) return "حجم المرفق يجب ألا يتجاوز 10 ميجابايت.";
  return null;
}

export async function savePartInstallation(
  input: PartInstallationInput,
  opts: { id?: string | undefined; receipt?: File | null | undefined; removeReceipt?: boolean | undefined; oldReceipt?: string | null },
) {
  const bad = validateInstallation(input);
  if (bad) throw new DataProviderError("VALIDATION_ERROR", bad);
  if (opts.receipt) {
    const fileError = validateDocument(opts.receipt);
    if (fileError) throw new DataProviderError("VALIDATION_ERROR", fileError);
  }
  const c = requireClient();
  const user_id = await requireUserId(c);
  let id = opts.id;

  if (id) {
    const { data, error } = await c.from("part_installations").update(input).eq("id", id).select("id").maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
  } else {
    const { data, error } = await c.from("part_installations").insert({ ...input, user_id }).select("id").single();
    if (error) throw toDataError(error);
    id = data.id as string;
  }

  if (opts.receipt) {
    const ext = opts.receipt.name.split(".").pop()?.toLowerCase() || "bin";
    const path = [user_id, "installations", id, String(Date.now()) + "." + ext].join("/");
    const upload = await c.storage.from(PART_DOCUMENT_BUCKET).upload(path, opts.receipt, { contentType: opts.receipt.type });
    if (upload.error) throw new DataProviderError("UNKNOWN", "تم حفظ التركيب لكن تعذّر رفع المرفق.");
    const linked = await c.from("part_installations").update({ receipt_url: path }).eq("id", id).select("id").maybeSingle();
    if (linked.error || !linked.data) {
      await c.storage.from(PART_DOCUMENT_BUCKET).remove([path]);
      if (linked.error) throw toDataError(linked.error);
      throw new DataProviderError("NOT_FOUND");
    }
    if (opts.oldReceipt) await c.storage.from(PART_DOCUMENT_BUCKET).remove([opts.oldReceipt]);
  } else if (opts.removeReceipt && opts.oldReceipt) {
    const cleared = await c.from("part_installations").update({ receipt_url: null }).eq("id", id).select("id").maybeSingle();
    if (cleared.error) throw toDataError(cleared.error);
    if (!cleared.data) throw new DataProviderError("NOT_FOUND");
    await c.storage.from(PART_DOCUMENT_BUCKET).remove([opts.oldReceipt]);
  }

  await c.from("parts").update({ status: "installed" }).eq("id", input.part_id);
  return id;
}

export async function deletePartInstallation(installation: Pick<PartInstallation, "id" | "receipt_url">) {
  const c = requireClient();
  const { data, error } = await c.from("part_installations").delete().eq("id", installation.id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
  if (installation.receipt_url) await c.storage.from(PART_DOCUMENT_BUCKET).remove([installation.receipt_url]);
}

export async function getPartDocumentUrl(path: string) {
  const c = requireClient();
  const { data, error } = await c.storage.from(PART_DOCUMENT_BUCKET).createSignedUrl(path, 300);
  if (error) throw toDataError(error);
  return data.signedUrl;
}
