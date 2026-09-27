import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { useCreateCustomMaintenanceItem, useMaintenanceCategories } from "../hooks/useMaintenance";

const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function CustomMaintenanceItemForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const categories = useMaintenanceCategories();
  const create = useCreateCustomMaintenanceItem();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [km, setKm] = useState("");
  const [months, setMonths] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        name_ar: name.trim(),
        category_id: categoryId || null,
        default_interval_km: km ? Number(km) : null,
        default_interval_months: months ? Number(months) : null,
      },
      {
        onSuccess: () => {
          toast.success("تمت إضافة نوع الصيانة");
          setName("");
          setCategoryId("");
          setKm("");
          setMonths("");
          onOpenChange(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>إضافة نوع صيانة خاص</DialogTitle>
          <DialogDescription>أضف بندًا لا يوجد في القائمة الافتراضية وحدد دوريته.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            اسم الصيانة
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          </label>
          <label className="block text-sm font-medium">
            التصنيف
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">بدون تصنيف</option>
              {(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              كل كم
              <input className={inputClass} type="number" min={1} value={km} onChange={(e) => setKm(e.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              كل كم شهر
              <input className={inputClass} type="number" min={1} value={months} onChange={(e) => setMonths(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>إلغاء</button>
            <button type="submit" className={primaryBtn} disabled={create.isPending || !name.trim() || (!km && !months)}>إضافة</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
