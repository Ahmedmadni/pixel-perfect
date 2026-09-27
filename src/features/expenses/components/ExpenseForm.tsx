import { useEffect, useMemo, useState } from "react";
import { Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import { useSaveExpense } from "../hooks/useExpenses";
import {
  localIsoDate,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
} from "../services/expenses.service";

const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function ExpenseForm({
  open,
  onOpenChange,
  vehicles,
  categories,
  vehicleId,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  categories: ExpenseCategory[];
  vehicleId?: string;
  expense?: Expense | null;
}) {
  const save = useSaveExpense();
  const manualCategories = useMemo(
    () => categories.filter((category) => category.code !== "maintenance"),
    [categories],
  );

  const defaultVehicle = vehicleId ?? expense?.vehicle_id ?? vehicles[0]?.id ?? "";
  const defaultCategory = expense?.category_id ?? manualCategories[0]?.id ?? "";
  const [form, setForm] = useState<ExpenseInput>({
    vehicle_id: defaultVehicle,
    category_id: defaultCategory,
    expense_date: expense?.expense_date ?? localIsoDate(),
    amount: expense?.amount ?? 0,
    odometer: expense?.odometer ?? null,
    vendor_name: expense?.vendor_name ?? null,
    description: expense?.description ?? null,
    notes: expense?.notes ?? null,
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextVehicle = vehicleId ?? expense?.vehicle_id ?? vehicles[0]?.id ?? "";
    const nextCategory = expense?.category_id ?? manualCategories[0]?.id ?? "";
    setForm({
      vehicle_id: nextVehicle,
      category_id: nextCategory,
      expense_date: expense?.expense_date ?? localIsoDate(),
      amount: expense?.amount ?? 0,
      odometer: expense?.odometer ?? null,
      vendor_name: expense?.vendor_name ?? null,
      description: expense?.description ?? null,
      notes: expense?.notes ?? null,
    });
    setReceipt(null);
    setRemoveReceipt(false);
  }, [open, vehicleId, expense, vehicles, manualCategories]);

  const set = <K extends keyof ExpenseInput>(key: K, value: ExpenseInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    save.mutate(
      {
        input: form,
        opts: {
          id: expense?.id,
          receipt,
          removeReceipt,
          oldReceipt: expense?.receipt_url ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(expense ? "تم تحديث المصروف" : "تم تسجيل المصروف");
          onOpenChange(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-right">
          <DialogTitle>{expense ? "تعديل المصروف" : "إضافة مصروف"}</DialogTitle>
          <DialogDescription>
            سجّل تكلفة السيارة وأرفق الإيصال إن وجد. مصروفات الصيانة تُضاف تلقائيًا من سجل الصيانة.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="السيارة">
            <select
              className={inputClass}
              value={form.vehicle_id}
              disabled={!!vehicleId}
              onChange={(event) => set("vehicle_id", event.target.value)}
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
              ))}
            </select>
          </Field>

          <Field label="نوع المصروف">
            <select
              className={inputClass}
              value={form.category_id}
              onChange={(event) => set("category_id", event.target.value)}
            >
              {manualCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name_ar}</option>
              ))}
            </select>
          </Field>

          <Field label="التاريخ">
            <input
              className={inputClass}
              type="date"
              max={localIsoDate()}
              value={form.expense_date}
              onChange={(event) => set("expense_date", event.target.value)}
            />
          </Field>

          <Field label="القيمة">
            <input
              className={inputClass}
              type="number"
              min={0.01}
              step="0.01"
              value={form.amount}
              onChange={(event) => set("amount", Number(event.target.value))}
            />
          </Field>

          <Field label="قراءة العداد (اختياري)">
            <input
              className={inputClass}
              type="number"
              min={0}
              value={form.odometer ?? ""}
              onChange={(event) => set("odometer", event.target.value ? Number(event.target.value) : null)}
            />
          </Field>

          <Field label="الجهة / المتجر">
            <input
              className={inputClass}
              value={form.vendor_name ?? ""}
              onChange={(event) => set("vendor_name", event.target.value || null)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="الوصف">
              <input
                className={inputClass}
                placeholder="مثال: تعبئة وقود، تجديد استمارة، غسيل..."
                value={form.description ?? ""}
                onChange={(event) => set("description", event.target.value || null)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="ملاحظات">
              <textarea
                className={inputClass + " min-h-24"}
                value={form.notes ?? ""}
                onChange={(event) => set("notes", event.target.value || null)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">الإيصال / الفاتورة</label>
            <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-ink-soft">
                <Paperclip className="size-4 shrink-0" />
                <span className="truncate">
                  {receipt?.name ?? (expense?.receipt_url ? "استبدال المرفق الحالي" : "PDF أو صورة، بحد أقصى 10 MB")}
                </span>
              </span>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
              />
              <span className={secondaryBtn}>اختيار ملف</span>
            </label>

            {expense?.receipt_url ? (
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={removeReceipt}
                  onChange={(event) => setRemoveReceipt(event.target.checked)}
                />
                حذف المرفق الحالي
              </label>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>إلغاء</button>
            <button
              type="submit"
              className={primaryBtn}
              disabled={save.isPending || !form.vehicle_id || !form.category_id || form.amount <= 0}
            >
              <Save className="size-4" />
              {save.isPending ? "جارٍ الحفظ..." : "حفظ المصروف"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium">{label}{children}</label>;
}
