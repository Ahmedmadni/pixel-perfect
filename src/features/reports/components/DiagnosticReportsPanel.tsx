import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { primaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { useDiagnosticIssues } from "@/features/diagnostics/hooks/useDiagnostics";
import { diagnosticReportCompleteness } from "@/features/diagnostics/lib/report-analytics";
import {
  DIAGNOSTIC_SEVERITY_LABELS,
  DIAGNOSTIC_STATUS_LABELS,
} from "@/features/diagnostics/lib/analytics";
import { DiagnosticReportDialog } from "@/features/diagnostics/components/DiagnosticReportDialog";
import type { DiagnosticIssue } from "@/features/diagnostics/services/diagnostics.service";
import { formatDate, formatKm } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";

export function DiagnosticReportsPanel({ vehicles }: { vehicles: Vehicle[] }) {
  const defaultVehicle = vehicles.find((vehicle) => vehicle.is_active) ?? vehicles[0] ?? null;
  const [vehicleId, setVehicleId] = useState(defaultVehicle?.id ?? "");
  const issuesQ = useDiagnosticIssues(vehicleId || undefined);
  const [reportIssue, setReportIssue] = useState<DiagnosticIssue | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!vehicleId && defaultVehicle) setVehicleId(defaultVehicle.id);
  }, [vehicleId, defaultVehicle]);

  const vehicle = useMemo(
    () => vehicles.find((item) => item.id === vehicleId) ?? defaultVehicle,
    [vehicles, vehicleId, defaultVehicle],
  );
  const issues = (issuesQ.data ?? []).filter((issue) => issue.vehicle_id === vehicleId);

  if (!vehicles.length) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="لا توجد سيارة لإعداد تقرير أعطال"
        description="أضف السيارة ومواصفاتها أولًا ليبدأ التقرير من بيانات المركبة الصحيحة."
      />
    );
  }

  return (
    <section className="rounded-2xl bg-panel p-5 ring-1 ring-border">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-brand-deep">الأولوية الرئيسية</p>
          <h2 className="mt-1 text-lg font-semibold">تقارير الأعطال الشاملة</h2>
          <p className="mt-1 text-xs text-ink-soft">
            اختر السيارة والموديل، ثم افتح العطل للوصول إلى تقرير التشخيص والسبب والإصلاح والتحقق النهائي.
          </p>
        </div>
        <label className="block min-w-72 text-sm font-medium">
          السيارة / الموديل
          <select
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            value={vehicleId}
            onChange={(event) => {
              setVehicleId(event.target.value);
              setReportIssue(null);
            }}
          >
            {vehicles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {[item.manufacturer, item.model, item.model_year].filter(Boolean).join(" ") || "بدون موديل"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {vehicle ? (
        <div className="mt-4 grid gap-2 rounded-xl bg-secondary/60 p-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
          <Info label="الصانع" value={vehicle.manufacturer || "—"} />
          <Info label="الموديل" value={vehicle.model || "—"} />
          <Info label="السنة" value={vehicle.model_year?.toString() || "—"} />
          <Info label="الفئة" value={vehicle.trim || "—"} />
          <Info label="المحرك" value={vehicle.engine || "—"} />
          <Info label="العداد" value={formatKm(vehicle.current_odometer)} />
        </div>
      ) : null}

      <div className="mt-5">
        {issuesQ.isPending ? (
          <CardsSkeleton count={3} />
        ) : issuesQ.isError ? (
          <QueryErrorState error={issuesQ.error} onRetry={() => issuesQ.refetch()} />
        ) : issues.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {issues.map((issue) => {
              const completeness = vehicle
                ? diagnosticReportCompleteness(issue, vehicle)
                : { percent: 0, missing: [], completed: 0, total: 0 };
              return (
                <article key={issue.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <StatusBadge tone={issue.status === "resolved" ? "success" : issue.status === "returned" ? "danger" : "brand"}>
                          {DIAGNOSTIC_STATUS_LABELS[issue.status]}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {formatDate(issue.first_detected_date)}
                        {issue.first_odometer != null ? " · " + formatKm(issue.first_odometer) : ""}
                        {" · "}خطورة {DIAGNOSTIC_SEVERITY_LABELS[issue.severity]}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-ink-soft">اكتمال التقرير</p>
                      <p className="num text-lg font-semibold">{completeness.percent}%</p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand-deep"
                      style={{ width: completeness.percent + "%" }}
                    />
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-ink-soft">
                    <p>أكواد الفحص: {issue.obd_codes.length ? issue.obd_codes.join("، ") : "لا يوجد"}</p>
                    <p>خطوات التشخيص المسجلة: {issue.tests.length}</p>
                    {issue.confirmed_cause ? <p>السبب المؤكد: {issue.confirmed_cause}</p> : null}
                  </div>

                  <button
                    className={primaryBtn + " mt-4"}
                    onClick={() => {
                      setReportIssue(issue);
                      setReportOpen(true);
                    }}
                  >
                    <FileText className="size-4" /> فتح التقرير الشامل
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="لا توجد أعطال مسجلة لهذه السيارة"
            description="ابدأ من شاشة الأعطال وسجّل المشكلة والفحوص، ثم سيظهر تقريرها هنا تلقائيًا."
          />
        )}
      </div>

      <DiagnosticReportDialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) setReportIssue(null);
        }}
        issue={reportIssue}
        vehicle={vehicle ?? null}
      />
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-ink-soft">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
