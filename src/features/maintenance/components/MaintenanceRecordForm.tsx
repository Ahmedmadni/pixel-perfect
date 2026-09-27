import { useEffect, useMemo, useState } from "react";
import { Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import type { MaintenanceItem, MaintenanceRecord, RecordInput } from "../services/maintenance.service";
import { useSaveMaintenanceRecord } from "../hooks/useMaintenance";

const today = () => new Date().toISOString().slice(0, 10);
const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function MaintenanceRecordForm({
  open,
  onOpenChange,
  vehicles,
  items,
  vehicleId,
  itemId,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  items: MaintenanceItem[];
  vehicleId?: string;
  itemId?: string;
  record?: MaintenanceRecord | null;
}) {
  const save = useSaveMaintenanceRecord();
  const firstVehicle = vehicleId ?? record?.vehicle_id ?? vehicles[0]?.id ?? "";
  const firstItem = itemId ?? record?.maintenance_item_id ?? items[0]?.id ?? "";
  const [form, setForm] = useState<RecordInput>({
    vehicle_id: firstVehicle,
    maintenance_item_id: firstItem,
    service_date: record?.service_date ?? today(),
    odometer: record?.odometer ?? vehicles.find((v) => v.id === firstVehicle)?.current_odometer ?? 0,
    parts_cost: record?.parts_cost ?? 0,
    labor_cost: record?.labor_cost ?? 0,
    other_cost: record?.other_cost ?? 0,
    workshop_name: record?.workshop_name ?? null,
    technician_name: record?.technician_name ?? null,
    notes: record?.notes ?? null,
  });
  const [invoice, setInvoice] = useState<File | null>(null);
  const [removeInvoice, setRemoveInvoice] = useState(false);

  useEffect(() => {
    if (!open) return;
    const vid = vehicleId ?? record?.vehicle_id ?? vehicles[0]?.id ?? "";
    const iid = itemId ?? record?.maintenance_item_id ?? items[0]?.id ?? "";
    setForm({
      vehicle_id: vid,
      maintenance_item_id: iid,
      service_date: record?.service_date ?? today(),
      odometer: record?.odometer ?? vehicles.find((v) => v.id === vid)?.current_odometer ?? 0,
      parts_cost: record?.parts_cost ?? 0,
      labor_cost: record?.labor_cost ?? 0,
      other_cost: record?.other_cost ?? 0,
      workshop_name: record?.workshop_name ?? null,
      technician_name: record?.technician_name ?? null,
      notes: record?.notes ?? null,
    });
    setInvoice(null);
    setRemoveInvoice(false);
  }, [open, vehicleId, itemId, record, vehicles, items]);

  const total = useMemo(
    () => form.parts_cost + form.labor_cost + form.other_cost,
    [form.parts_cost, form.labor_cost, form.other_cost],
  );
  const set = <K extends keyof RecordInput>(key: K, value: RecordInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate(
      {
        input: form,
        opts: {
          id: record?.id,
          invoice,
          removeInvoice,
          oldInvoice: record?.invoice_url ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(record ? "تم تحديث سجل الصيانة" : "تم تسجيل الصيانة");
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
          <DialogTitle>{record ? "تعديل سجل الصيانة" : "تسجيل صيانة"}</DialogTitle>
          <DialogDescription>احفظ تفاصيل الخدمة والتكاليف والفاتورة إن وجدت.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="السيارة">
            <select
              className={inputClass}
              value={form.vehicle_id}
              onChange={(e) => {
                const vid = e.target.value;
                set("vehicle_id", vid);
                const vehicle = vehicles.find((x) => x.id === vid);
                if (!record && vehicle) set("odometer", vehicle.current_odometer);
              }}
              disabled={!!vehicleId}
            >
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
            </select>
          </Field>
          <Field label="نوع الصيانة">
            <select className={inputClass} value={form.maintenance_item_id} onChange={(e) => set("maintenance_item_id", e.target.value)} disabled={!!itemId}>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name_ar}</option>)}
            </select>
          </Field>
          <Field label="تاريخ الصيانة">
            <input type="date" className={inputClass} max={today()} value={form.service_date} onChange={(e) => set("service_date", e.target.value)} />
          </Field>
          <Field label="قراءة العداد">
            <input type="number" min={0} className={inputClass} value={form.odometer} onChange={(e) => set("odometer", Number(e.target.value))} />
          </Field>
          <Field label="تكلفة القطع"><Money value={form.parts_cost} onChange={(value) => set("parts_cost", value)} /></Field>
          <Field label="تكلفة العمالة"><Money value={form.labor_cost} onChange={(value) => set("labor_cost", value)} /></Field>
          <Field label="تكاليف أخرى"><Money value={form.other_cost} onChange={(value) => set("other_cost", value)} /></Field>
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-xs text-ink-soft">الإجمالي</p>
            <p className="num mt-1 text-lg font-semibold">{new Intl.NumberFormat("ar-SA-u-nu-latn").format(total)} ر.س</p>
          </div>
          <Field label="اسم الورشة">
            <input className={inputClass} value={form.workshop_name ?? ""} onChange={(e) => set("workshop_name", e.target.value || null)} />
          </Field>
          <Field label="الفني">
            <input className={inputClass} value={form.technician_name ?? ""} onChange={(e) => set("technician_name", e.target.value || null)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="ملاحظات">
              <textarea className={`${inputClass} min-h-24`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">الفاتورة</label>
            <label className="mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border p-3 text-sm">
              <span className="flex items-center gap-2 text-ink-soft">
                <Paperclip className="size-4" />
                {invoice?.name ?? (record?.invoice_url ? "استبدال الفاتورة الحالية" : "PDF أو صورة، بحد أقصى 10 MB")}
              </span>
              <input type="file" className="sr-only" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(e) => setInvoice(e.target.files?.[0] ?? null)} />
              <span className={secondaryBtn}>اختيار ملف</span>
            </label>
            {record?.invoice_url ? (
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <input type="checkbox" checked={removeInvoice} onChange={(e) => setRemoveInvoice(e.target.checked)} />
                حذف الفاتورة الحالية
              </label>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>إلغاء</button>
            <button type="submit" className={primaryBtn} disabled={save.isPending || !form.vehicle_id || !form.maintenance_item_id}>
              <Save className="size-4" /> {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
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

function Money({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <input type="number" min={0} step="0.01" className={inputClass} value={value} onChange={(e) => onChange(Number(e.target.value))} />;
}
