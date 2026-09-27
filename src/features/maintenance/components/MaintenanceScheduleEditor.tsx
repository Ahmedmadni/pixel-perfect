import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import type { MaintenanceRow } from "../lib/view-model";
import { useUpsertMaintenanceSchedule } from "../hooks/useMaintenance";

const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function MaintenanceScheduleEditor({
  row,
  open,
  onOpenChange,
}: {
  row: MaintenanceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useUpsertMaintenanceSchedule();
  const [km, setKm] = useState("");
  const [months, setMonths] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!row || !open) return;
    setKm(String(row.schedule?.interval_km ?? row.item.default_interval_km ?? ""));
    setMonths(String(row.schedule?.interval_months ?? row.item.default_interval_months ?? ""));
    setEnabled(row.schedule?.is_enabled ?? true);
  }, [row, open]);

  if (!row) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      {
        id: row.schedule?.id,
        vehicle_id: row.vehicle.id,
        maintenance_item_id: row.item.id,
        interval_km: km ? Number(km) : null,
        interval_months: months ? Number(months) : null,
        is_enabled: enabled,
      },
      {
        onSuccess: () => {
          toast.success("تم تحديث جدول الصيانة");
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
          <DialogTitle>جدول {row.item.name_ar}</DialogTitle>
          <DialogDescription>{row.vehicle.name} · الاستحقاق يكون عند الكيلومترات أو التاريخ، أيهما يأتي أولًا.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">
            الفترة بالكيلومترات
            <input className={inputClass} type="number" min={1} placeholder="مثال: 7000" value={km} onChange={(e) => setKm(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            الفترة بالأشهر
            <input className={inputClass} type="number" min={1} placeholder="مثال: 6" value={months} onChange={(e) => setMonths(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            تفعيل هذا البند في جدول الصيانة
          </label>
          <p className="text-xs text-ink-soft">يمكن ترك أحد الحقلين فارغًا، لكن يجب وجود كيلومترات أو أشهر على الأقل للصيانة الدورية.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>إلغاء</button>
            <button type="submit" className={primaryBtn} disabled={save.isPending || (!km && !months)}>حفظ الجدول</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
