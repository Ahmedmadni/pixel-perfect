import { useState } from "react";
import { ExternalLink, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { errorMessage } from "@/lib/data-provider";
import { formatDate } from "@/lib/format";
import { useDeleteVehicleDocument, useVehicleDocuments } from "../hooks/useDocuments";
import { getVehicleDocumentUrl, type VehicleDocument } from "../services/documents.service";
import { DocumentForm } from "./DocumentForm";

export function DocumentsWorkspace({ vehicleId }: { vehicleId: string }) {
  const query = useVehicleDocuments(vehicleId);
  const remove = useDeleteVehicleDocument();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<VehicleDocument | null>(null);

  async function openFile(path: string) {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await getVehicleDocumentUrl(path);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (error) {
      tab?.close();
      toast.error(errorMessage(error));
    }
  }

  if (query.isPending) return <CardsSkeleton count={4} />;
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          className={primaryBtn}
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> إضافة مستند
        </button>
      </div>

      {(query.data ?? []).length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {(query.data ?? []).map((doc) => {
            const expired =
              doc.expiry_date != null &&
              new Date(doc.expiry_date + "T00:00:00").getTime() <
                new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

            return (
              <article key={doc.id} className="rounded-2xl bg-panel p-4 ring-1 ring-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{doc.title}</p>
                      {doc.expiry_date ? (
                        <StatusBadge tone={expired ? "danger" : "brand"}>
                          {expired ? "منتهي" : "له تاريخ انتهاء"}
                        </StatusBadge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {doc.issuer ?? "بدون جهة"}
                      {doc.reference_number ? " · " + doc.reference_number : ""}
                    </p>
                  </div>
                  <FileText className="size-5 text-brand-deep" />
                </div>

                <div className="mt-3 grid gap-1 text-xs text-ink-soft">
                  {doc.document_date ? <p>تاريخ المستند: {formatDate(doc.document_date)}</p> : null}
                  {doc.expiry_date ? (
                    <p>
                      الانتهاء: {formatDate(doc.expiry_date)} · تذكير قبل {doc.remind_days_before} يوم
                    </p>
                  ) : null}
                </div>

                {doc.notes ? <p className="mt-2 text-sm">{doc.notes}</p> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {doc.file_url ? (
                    <button className={secondaryBtn} onClick={() => openFile(doc.file_url!)}>
                      <ExternalLink className="size-4" /> فتح
                    </button>
                  ) : null}

                  <button
                    className={secondaryBtn}
                    onClick={() => {
                      setSelected(doc);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" /> تعديل
                  </button>

                  <ConfirmDialog
                    title="حذف المستند؟"
                    description="سيتم حذف المستند والملف والتذكير التلقائي المرتبط به."
                    confirmLabel="حذف"
                    onConfirm={() =>
                      remove.mutate(doc, {
                        onSuccess: () => toast.success("تم حذف المستند"),
                        onError: (error) => toast.error(errorMessage(error)),
                      })
                    }
                    trigger={
                      <button className={secondaryBtn + " text-destructive"}>
                        <Trash2 className="size-4" /> حذف
                      </button>
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="لا توجد مستندات"
          description="أضف التأمين أو الاستمارة أو الفحص أو أي ملف مهم للسيارة."
          action={
            <button className={primaryBtn} onClick={() => setFormOpen(true)}>
              <Plus className="size-4" /> إضافة مستند
            </button>
          }
        />
      )}

      <DocumentForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelected(null);
        }}
        vehicleId={vehicleId}
        doc={selected}
      />
    </div>
  );
}
