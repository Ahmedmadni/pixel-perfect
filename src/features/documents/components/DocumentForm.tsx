import { useEffect, useState } from "react";
import { Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { useSaveVehicleDocument } from "../hooks/useDocuments";
import type {
  VehicleDocument,
  VehicleDocumentInput,
  VehicleDocumentType,
} from "../services/documents.service";

const labels: Record<VehicleDocumentType, string> = {
  registration: "الاستمارة",
  insurance: "التأمين",
  inspection: "الفحص الدوري",
  ownership: "الملكية",
  warranty: "الضمان",
  invoice: "فاتورة",
  other: "أخرى",
};
const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function DocumentForm({
  open,
  onOpenChange,
  vehicleId,
  doc,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  doc?: VehicleDocument | null;
}) {
  const save = useSaveVehicleDocument();
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [form, setForm] = useState<VehicleDocumentInput>({
    vehicle_id: vehicleId,
    document_type: "other",
    title: "",
    document_date: null,
    expiry_date: null,
    remind_days_before: 30,
    issuer: null,
    reference_number: null,
    notes: null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      vehicle_id: vehicleId,
      document_type: doc?.document_type ?? "other",
      title: doc?.title ?? "",
      document_date: doc?.document_date ?? null,
      expiry_date: doc?.expiry_date ?? null,
      remind_days_before: doc?.remind_days_before ?? 30,
      issuer: doc?.issuer ?? null,
      reference_number: doc?.reference_number ?? null,
      notes: doc?.notes ?? null,
    });
    setFile(null);
    setRemoveFile(false);
  }, [open, doc, vehicleId]);

  const set = <K extends keyof VehicleDocumentInput>(key: K, value: VehicleDocumentInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-right">
          <DialogTitle>{doc ? "تعديل المستند" : "إضافة مستند"}</DialogTitle>
          <DialogDescription>
            إذا أدخلت تاريخ انتهاء، سيُنشأ تذكير التجديد تلقائيًا.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              {
                input: form,
                opts: {
                  id: doc?.id,
                  file,
                  removeFile,
                  oldFile: doc?.file_url ?? null,
                },
              },
              {
                onSuccess: () => {
                  toast.success("تم حفظ المستند");
                  onOpenChange(false);
                },
                onError: (error) => toast.error(errorMessage(error)),
              },
            );
          }}
        >
          <Field label="النوع">
            <select
              className={inputClass}
              value={form.document_type}
              onChange={(event) => set("document_type", event.target.value as VehicleDocumentType)}
            >
              {(Object.keys(labels) as VehicleDocumentType[]).map((type) => (
                <option key={type} value={type}>
                  {labels[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="العنوان">
            <input className={inputClass} value={form.title} onChange={(event) => set("title", event.target.value)} />
          </Field>

          <Field label="تاريخ المستند">
            <input
              className={inputClass}
              type="date"
              value={form.document_date ?? ""}
              onChange={(event) => set("document_date", event.target.value || null)}
            />
          </Field>

          <Field label="تاريخ الانتهاء">
            <input
              className={inputClass}
              type="date"
              value={form.expiry_date ?? ""}
              onChange={(event) => set("expiry_date", event.target.value || null)}
            />
          </Field>

          <Field label="التذكير قبل الانتهاء بـ (يوم)">
            <input
              className={inputClass}
              type="number"
              min="0"
              max="3650"
              value={form.remind_days_before}
              onChange={(event) => set("remind_days_before", Number(event.target.value))}
            />
          </Field>

          <Field label="الجهة المصدرة">
            <input className={inputClass} value={form.issuer ?? ""} onChange={(event) => set("issuer", event.target.value || null)} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="الرقم المرجعي">
              <input
                dir="ltr"
                className={inputClass}
                value={form.reference_number ?? ""}
                onChange={(event) => set("reference_number", event.target.value || null)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="ملاحظات">
              <textarea className={inputClass} value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value || null)} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">الملف</label>
            <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-ink-soft">
                <Paperclip className="size-4" />
                <span className="truncate">
                  {file?.name ?? (doc?.file_url ? "استبدال الملف الحالي" : "PDF أو صورة، بحد أقصى 15 MB")}
                </span>
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <span className={secondaryBtn}>اختيار ملف</span>
            </label>

            {doc?.file_url ? (
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={removeFile}
                  onChange={(event) => setRemoveFile(event.target.checked)}
                />
                حذف الملف الحالي
              </label>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>
              إلغاء
            </button>
            <button className={primaryBtn} disabled={save.isPending || !form.title.trim()}>
              <Save className="size-4" /> {save.isPending ? "جارٍ الحفظ..." : "حفظ المستند"}
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
