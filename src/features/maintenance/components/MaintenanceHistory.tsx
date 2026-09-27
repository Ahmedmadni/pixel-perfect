import { ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, StatusBadge } from "@/components/common/states";
import { secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { formatCurrency, formatDate, formatKm } from "@/lib/format";
import { getInvoiceUrl, type MaintenanceRecord } from "../services/maintenance.service";
import { useDeleteMaintenanceRecord } from "../hooks/useMaintenance";

export function MaintenanceHistory({
  records,
  onEdit,
  showVehicle = true,
}: {
  records: MaintenanceRecord[];
  onEdit: (record: MaintenanceRecord) => void;
  showVehicle?: boolean;
}) {
  const del = useDeleteMaintenanceRecord();

  if (!records.length) {
    return <EmptyState icon={FileText} title="لا توجد أعمال صيانة مسجلة" description="سجّل أول صيانة لتكوين سجل السيارة وتحديث الاستحقاقات القادمة." />;
  }

  async function openInvoice(path: string) {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await getInvoiceUrl(path);
      if (tab) {
        tab.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      tab?.close();
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="rounded-2xl bg-panel p-4 ring-1 ring-border">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{record.item?.name_ar ?? "صيانة"}</p>
                {showVehicle && record.vehicle?.name ? <StatusBadge>{record.vehicle.name}</StatusBadge> : null}
              </div>
              <p className="mt-1 text-xs text-ink-soft">{formatDate(record.service_date)} · {formatKm(record.odometer)}</p>
            </div>
            <p className="num text-sm font-semibold">{formatCurrency(record.total_cost ?? 0)}</p>
          </div>

          {(record.workshop_name || record.technician_name || record.notes) ? (
            <div className="mt-3 grid gap-1 text-xs text-ink-soft">
              {record.workshop_name ? <p>الورشة: {record.workshop_name}</p> : null}
              {record.technician_name ? <p>الفني: {record.technician_name}</p> : null}
              {record.notes ? <p className="whitespace-pre-wrap">{record.notes}</p> : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onEdit(record)}>
              <Pencil className="size-4" /> تعديل
            </button>
            {record.invoice_url ? (
              <button type="button" className={secondaryBtn} onClick={() => openInvoice(record.invoice_url!)}>
                <ExternalLink className="size-4" /> الفاتورة
              </button>
            ) : null}
            <ConfirmDialog
              title="حذف سجل الصيانة؟"
              description="سيتم حذف هذا السجل وإعادة حساب آخر صيانة وموعد الاستحقاق لهذا البند. لا يمكن التراجع."
              confirmLabel="حذف"
              onConfirm={() =>
                del.mutate(record, {
                  onSuccess: () => toast.success("تم حذف سجل الصيانة"),
                  onError: (err) => toast.error(errorMessage(err)),
                })
              }
              trigger={
                <button type="button" className={`${secondaryBtn} text-destructive`}>
                  <Trash2 className="size-4" /> حذف
                </button>
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
