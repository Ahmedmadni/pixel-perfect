import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export const EXPENSE_RECEIPT_BUCKET = "expense-documents";
const MAINTENANCE_RECEIPT_BUCKET = "maintenance-documents";
const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const RECEIPT_MAX = 10 * 1024 * 1024;

export type ExpenseSource = "manual" | "maintenance" | "part";

export interface ExpenseCategory {
  id: string;
  code: string;
  name_ar: string;
  sort_order: number;
}

export interface Expense {
  id: string;
  vehicle_id: string;
  category_id: string;
  expense_date: string;
  amount: number;
  odometer: number | null;
  vendor_name: string | null;
  description: string | null;
  notes: string | null;
  receipt_url: string | null;
  source: ExpenseSource;
  maintenance_record_id: string | null;
  part_installation_id: string | null;
  created_at: string;
  category: { code: string; name_ar: string } | null;
  vehicle?: { name: string } | null;
}

export interface ExpenseInput {
  vehicle_id: string;
  category_id: string;
  expense_date: string;
  amount: number;
  odometer: number | null;
  vendor_name: string | null;
  description: string | null;
  notes: string | null;
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const c = requireClient();
  const { data, error } = await c
    .from("expense_categories")
    .select("id,code,name_ar,sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw toDataError(error);
  return (data ?? []) as ExpenseCategory[];
}

export async function getExpenses(vehicleId?: string): Promise<Expense[]> {
  const c = requireClient();
  let q = c
    .from("expenses")
    .select("*, category:expense_categories(code,name_ar), vehicle:vehicles(name)")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  return (data ?? []) as unknown as Expense[];
}

export function validateReceipt(file: File): string | null {
  if (!RECEIPT_TYPES.includes(file.type)) return "الصيغ المسموحة: صورة JPG/PNG/WEBP أو PDF.";
  if (file.size > RECEIPT_MAX) return "حجم الإيصال يجب ألا يتجاوز 10 ميجابايت.";
  return null;
}

export function validateExpense(input: ExpenseInput): string | null {
  if (!input.vehicle_id) return "اختر السيارة.";
  if (!input.category_id) return "اختر نوع المصروف.";
  if (!input.expense_date) return "أدخل تاريخ المصروف.";
  if (input.expense_date > localIsoDate()) return "تاريخ المصروف لا يمكن أن يكون في المستقبل.";
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "قيمة المصروف يجب أن تكون أكبر من صفر.";
  if (input.odometer != null && (!Number.isFinite(input.odometer) || input.odometer < 0))
    return "قراءة العداد غير صحيحة.";
  return null;
}

export function localIsoDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return [y, m, d].join("-");
}

export async function saveExpense(
  input: ExpenseInput,
  opts: { id?: string; receipt?: File | null; removeReceipt?: boolean; oldReceipt?: string | null },
) {
  const invalid = validateExpense(input);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);
  if (opts.receipt) {
    const receiptError = validateReceipt(opts.receipt);
    if (receiptError) throw new DataProviderError("VALIDATION_ERROR", receiptError);
  }

  const c = requireClient();
  const user_id = await requireUserId(c);
  let id = opts.id;

  if (id) {
    const { data, error } = await c
      .from("expenses")
      .update(input)
      .eq("id", id)
      .eq("source", "manual")
      .select("id")
      .maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
  } else {
    const { data, error } = await c
      .from("expenses")
      .insert({ ...input, user_id, source: "manual" })
      .select("id")
      .single();
    if (error) throw toDataError(error);
    id = data.id as string;
  }

  if (opts.receipt) {
    const ext = opts.receipt.name.split(".").pop()?.toLowerCase() || "bin";
    const path = [user_id, input.vehicle_id, id, String(Date.now()) + "." + ext].join("/");
    const upload = await c.storage
      .from(EXPENSE_RECEIPT_BUCKET)
      .upload(path, opts.receipt, { contentType: opts.receipt.type });

    if (upload.error) throw new DataProviderError("UNKNOWN", "تم حفظ المصروف لكن تعذّر رفع الإيصال.");

    const linked = await c
      .from("expenses")
      .update({ receipt_url: path })
      .eq("id", id)
      .eq("source", "manual")
      .select("id")
      .maybeSingle();

    if (linked.error || !linked.data) {
      await c.storage.from(EXPENSE_RECEIPT_BUCKET).remove([path]);
      if (linked.error) throw toDataError(linked.error);
      throw new DataProviderError("NOT_FOUND");
    }

    if (opts.oldReceipt) await c.storage.from(EXPENSE_RECEIPT_BUCKET).remove([opts.oldReceipt]);
  } else if (opts.removeReceipt && opts.oldReceipt) {
    const cleared = await c
      .from("expenses")
      .update({ receipt_url: null })
      .eq("id", id)
      .eq("source", "manual")
      .select("id")
      .maybeSingle();
    if (cleared.error) throw toDataError(cleared.error);
    if (!cleared.data) throw new DataProviderError("NOT_FOUND");
    await c.storage.from(EXPENSE_RECEIPT_BUCKET).remove([opts.oldReceipt]);
  }

  return id;
}

export async function deleteExpense(expense: Pick<Expense, "id" | "receipt_url" | "source">) {
  if (expense.source !== "manual")
    throw new DataProviderError(
      "VALIDATION_ERROR",
      expense.source === "maintenance" ? "مصروف الصيانة يُدار من سجل الصيانة." : "مصروف قطعة الغيار يُدار من سجل قطع الغيار.",
    );

  const c = requireClient();
  const { data, error } = await c
    .from("expenses")
    .delete()
    .eq("id", expense.id)
    .eq("source", "manual")
    .select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");

  if (expense.receipt_url) {
    await c.storage.from(EXPENSE_RECEIPT_BUCKET).remove([expense.receipt_url]);
  }
}

export async function getExpenseReceiptUrl(expense: Pick<Expense, "receipt_url" | "source">) {
  if (!expense.receipt_url) throw new DataProviderError("NOT_FOUND");
  const c = requireClient();
  const bucket =
    expense.source === "maintenance"
      ? MAINTENANCE_RECEIPT_BUCKET
      : expense.source === "part"
        ? "part-documents"
        : EXPENSE_RECEIPT_BUCKET;
  const { data, error } = await c.storage.from(bucket).createSignedUrl(expense.receipt_url, 300);
  if (error) throw toDataError(error);
  return data.signedUrl;
}
