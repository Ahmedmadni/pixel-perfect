import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import { useSaveReminder } from "../hooks/useReminders";
import type { Reminder, ReminderInput, ReminderType } from "../services/reminders.service";

const labels: Record<ReminderType, string> = {
  registration: "تجديد الاستمارة",
  insurance: "التأمين",
  inspection: "الفحص الدوري",
  maintenance: "صيانة",
  document: "مستند",
  custom: "مخصص",
};
const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function ReminderForm({
  open,
  onOpenChange,
  vehicles,
  reminder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  reminder?: Reminder | null;
}) {
  const save = useSaveReminder();
  const [form, setForm] = useState<ReminderInput>({
    vehicle_id: vehicles[0]?.id ?? "",
    title: "",
    reminder_type: "custom",
    due_date: null,
    due_odometer: null,
    recurring_months: null,
    recurring_km: null,
    notes: null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      vehicle_id: reminder?.vehicle_id ?? vehicles[0]?.id ?? "",
      title: reminder?.title ?? "",
      reminder_type: reminder?.reminder_type ?? "custom",
      due_date: reminder?.due_date ?? null,
      due_odometer: reminder?.due_odometer ?? null,
      recurring_months: reminder?.recurring_months ?? null,
      recurring_km: reminder?.recurring_km ?? null,
      notes: reminder?.notes ?? null,
    });
  }, [open, reminder, vehicles]);

  const set = <K extends keyof ReminderInput>(key: K, value: ReminderInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-xl">
        <DialogHeader className="text-right">
          <DialogTitle>{reminder ? "تعديل التذكير" : "إضافة تذكير"}</DialogTitle>
          <DialogDescription>
            يمكن أن يعتمد التذكير على التاريخ أو العداد أو كليهما؛ النظام يأخذ الأقرب.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              { input: form, id: reminder?.id },
              {
                onSuccess: () => {
                  toast.success("تم حفظ التذكير");
                  onOpenChange(false);
                },
                onError: (error) => toast.error(errorMessage(error)),
              },
            );
          }}
        >
          <Field label="السيارة">
            <select className={inputClass} value={form.vehicle_id} onChange={(event) => set("vehicle_id", event.target.value)}>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="النوع">
            <select
              className={inputClass}
              value={form.reminder_type}
              onChange={(event) => set("reminder_type", event.target.value as ReminderType)}
            >
              {(Object.keys(labels) as ReminderType[])
                .filter((type) => type !== "document")
                .map((type) => (
                  <option key={type} value={type}>
                    {labels[type]}
                  </option>
                ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="العنوان">
              <input className={inputClass} value={form.title} onChange={(event) => set("title", event.target.value)} />
            </Field>
          </div>

          <Field label="تاريخ الاستحقاق">
            <input
              className={inputClass}
              type="date"
              value={form.due_date ?? ""}
              onChange={(event) => set("due_date", event.target.value || null)}
            />
          </Field>

          <Field label="عداد الاستحقاق">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.due_odometer ?? ""}
              onChange={(event) => set("due_odometer", event.target.value ? Number(event.target.value) : null)}
            />
          </Field>

          <Field label="تكرار كل كم شهر">
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.recurring_months ?? ""}
              onChange={(event) => set("recurring_months", event.target.value ? Number(event.target.value) : null)}
            />
          </Field>

          <Field label="تكرار كل كم كيلومتر">
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.recurring_km ?? ""}
              onChange={(event) => set("recurring_km", event.target.value ? Number(event.target.value) : null)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="ملاحظات">
              <textarea className={inputClass} value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value || null)} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>
              إلغاء
            </button>
            <button className={primaryBtn} disabled={save.isPending || !form.title.trim()}>
              <Save className="size-4" />
              {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
