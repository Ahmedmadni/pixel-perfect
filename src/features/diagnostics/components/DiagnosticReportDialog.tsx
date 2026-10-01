import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn } from "@/components/common/buttons";
import { StatusBadge } from "@/components/common/states";
import { formatCurrency, formatDate, formatKm } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";
import {
  buildDiagnosticNarrative,
  diagnosticReportCompleteness,
  diagnosticTestOutcomeSummary,
} from "../lib/report-analytics";
import {
  DIAGNOSTIC_SEVERITY_LABELS,
  DIAGNOSTIC_STATUS_LABELS,
} from "../lib/analytics";
import type { DiagnosticIssue, DiagnosticTestResult } from "../services/diagnostics.service";

const printCss =
  "@media print { body * { visibility: hidden !important; } #diagnostic-comprehensive-report, #diagnostic-comprehensive-report * { visibility: visible !important; } #diagnostic-comprehensive-report { position: absolute; inset: 0; width: 100%; padding: 18mm; background: white; color: black; } .diagnostic-print-hide { display: none !important; } .diagnostic-report-section { break-inside: avoid; } }";

const resultLabels: Record<DiagnosticTestResult, string> = {
  pass: "طبيعي",
  fail: "غير طبيعي",
  inconclusive: "غير حاسم",
};
const resultTones: Record<DiagnosticTestResult, "success" | "danger" | "warning"> = {
  pass: "success",
  fail: "danger",
  inconclusive: "warning",
};

export function DiagnosticReportDialog({
  open,
  onOpenChange,
  issue,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: DiagnosticIssue | null;
  vehicle: Vehicle | null;
}) {
  if (!issue || !vehicle) return null;

  const completeness = diagnosticReportCompleteness(issue, vehicle);
  const tests = diagnosticTestOutcomeSummary(issue.tests);
  const narrative = buildDiagnosticNarrative(issue, vehicle);
  const vehicleIdentity = [vehicle.manufacturer, vehicle.model, vehicle.model_year].filter(Boolean).join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[95vh] overflow-y-auto sm:max-w-5xl print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:shadow-none"
      >
        <style>{printCss}</style>

        <DialogHeader className="diagnostic-print-hide flex-row items-center justify-between gap-3 text-right">
          <DialogTitle>تقرير العطل الشامل</DialogTitle>
          <button className={primaryBtn} onClick={() => window.print()}>
            <Printer className="size-4" /> طباعة / حفظ PDF
          </button>
        </DialogHeader>

        <div id="diagnostic-comprehensive-report" className="space-y-6 bg-white p-1 text-foreground print:p-0">
          <header className="border-b border-border pb-4 text-center">
            <p className="text-xs text-ink-soft">كمتر · تقرير تشخيص أعطال المركبة</p>
            <h1 className="mt-2 text-2xl font-bold">{issue.title}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {vehicleIdentity || vehicle.name} · تاريخ التقرير{" "}
              {new Date().toLocaleDateString("ar-SA-u-ca-gregory-nu-latn")}
            </p>
          </header>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">1. تعريف السيارة</h2>
                <p className="mt-1 text-xs text-ink-soft">الهوية الفنية التي بُني عليها التشخيص</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-ink-soft">اكتمال التقرير</p>
                <p className="num text-xl font-bold">{completeness.percent}%</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label="اسم السيارة" value={vehicle.name} />
              <Info label="الصانع / الموديل" value={vehicleIdentity || "—"} />
              <Info label="الفئة" value={vehicle.trim || "—"} />
              <Info label="المحرك" value={vehicle.engine || "—"} />
              <Info label="ناقل الحركة" value={vehicle.transmission || "—"} />
              <Info label="نوع الوقود" value={vehicle.fuel_type || "—"} />
              <Info label="اللوحة" value={vehicle.plate_number || "—"} />
              <Info label="VIN" value={vehicle.vin || "—"} dir="ltr" />
              <Info label="العداد الحالي" value={formatKm(vehicle.current_odometer)} />
            </div>
          </section>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <h2 className="font-semibold">2. وصف المشكلة عند الاستلام / أول ظهور</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge tone="brand">{DIAGNOSTIC_STATUS_LABELS[issue.status]}</StatusBadge>
              <StatusBadge
                tone={
                  issue.severity === "critical"
                    ? "danger"
                    : issue.severity === "high"
                      ? "warning"
                      : "neutral"
                }
              >
                خطورة {DIAGNOSTIC_SEVERITY_LABELS[issue.severity]}
              </StatusBadge>
              {issue.safe_to_drive != null ? (
                <StatusBadge tone={issue.safe_to_drive ? "success" : "danger"}>
                  {issue.safe_to_drive ? "قابلة للقيادة بحذر" : "لا يُنصح بالقيادة"}
                </StatusBadge>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="تاريخ أول ظهور" value={formatDate(issue.first_detected_date)} />
              <Info
                label="العداد عند الظهور"
                value={issue.first_odometer != null ? formatKm(issue.first_odometer) : "—"}
              />
            </div>
            <ReportText label="الأعراض" value={issue.symptoms} />
            <ReportText label="ظروف ظهور المشكلة" value={issue.operating_conditions} />

            {issue.obd_codes.length ? (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-soft">أكواد OBD / DTC</p>
                <div className="mt-2 flex flex-wrap gap-2" dir="ltr">
                  {issue.obd_codes.map((code) => (
                    <code key={code} className="rounded-lg bg-secondary px-2 py-1 text-sm font-semibold">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">3. مسار الفحص والتشخيص</h2>
              <p className="text-xs text-ink-soft">
                {tests.total} اختبار · {tests.fail} غير طبيعي · {tests.inconclusive} غير حاسم
              </p>
            </div>

            <ReportText label="ملخص التشخيص" value={issue.diagnostic_summary} />

            {issue.tests.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-secondary">
                      <Th>#</Th>
                      <Th>الفحص</Th>
                      <Th>الطريقة</Th>
                      <Th>المتوقع</Th>
                      <Th>الفعلي</Th>
                      <Th>النتيجة</Th>
                      <Th>الاستنتاج</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {issue.tests.map((test) => (
                      <tr key={test.id} className="border-b border-border align-top">
                        <Td>{test.sequence_no}</Td>
                        <Td>
                          <strong>{test.test_name}</strong>
                          {test.system_area ? <div className="text-ink-soft">{test.system_area}</div> : null}
                        </Td>
                        <Td>{test.test_method || "—"}</Td>
                        <Td>{test.expected_result || "—"}</Td>
                        <Td>{test.actual_result || "—"}</Td>
                        <Td>
                          <StatusBadge tone={resultTones[test.result_status]}>
                            {resultLabels[test.result_status]}
                          </StatusBadge>
                        </Td>
                        <Td>{test.conclusion || "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-ink-soft">
                لم تُسجّل خطوات فحص منظمة لهذا العطل بعد.
              </p>
            )}
          </section>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <h2 className="font-semibold">4. تحليل السبب الجذري</h2>
            <ReportText label="السبب المحتمل قبل اكتمال الفحص" value={issue.suspected_cause} />
            <ReportText label="السبب المؤكد" value={issue.confirmed_cause} />
            <ReportText label="شرح لماذا كان هذا هو السبب" value={issue.root_cause_explanation} />
          </section>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <h2 className="font-semibold">5. الإصلاح المنفذ</h2>
            <ReportText label="الإجراءات والإصلاحات" value={issue.repair_actions || issue.resolution} />

            {issue.part ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info label="القطعة المرتبطة" value={issue.part.name_ar} />
                <Info label="رقم القطعة" value={issue.part.part_number || "—"} dir="ltr" />
                <Info label="الشركة" value={issue.part.manufacturer || "—"} />
              </div>
            ) : null}

            {issue.maintenance ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Info label="سجل الصيانة" value={issue.maintenance.item?.name_ar || "صيانة"} />
                <Info label="تاريخ الصيانة" value={formatDate(issue.maintenance.service_date)} />
                <Info
                  label="العداد"
                  value={issue.maintenance.odometer != null ? formatKm(issue.maintenance.odometer) : "—"}
                />
                <Info label="التكلفة" value={formatCurrency(issue.maintenance.cost)} />
              </div>
            ) : null}
          </section>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <h2 className="font-semibold">6. التحقق بعد الإصلاح وإغلاق الحالة</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info label="تاريخ الحل" value={issue.resolved_date ? formatDate(issue.resolved_date) : "—"} />
              <Info
                label="العداد عند الحل"
                value={issue.resolved_odometer != null ? formatKm(issue.resolved_odometer) : "—"}
              />
            </div>
            <ReportText label="نتيجة التحقق بعد الإصلاح" value={issue.verification_result} />
            <ReportText label="التوصيات الوقائية / ما يجب مراقبته" value={issue.prevention_notes} />
          </section>

          <section className="diagnostic-report-section rounded-2xl border border-border p-4">
            <h2 className="font-semibold">7. شرح المشكلة والحل بشكل مبسط</h2>
            <div className="mt-3 space-y-2 text-sm leading-7">
              {narrative.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </section>

          {issue.events.length ? (
            <section className="diagnostic-report-section rounded-2xl border border-border p-4">
              <h2 className="font-semibold">8. السجل الزمني للحالة</h2>
              <div className="mt-3 space-y-2">
                {[...issue.events].reverse().map((event) => (
                  <div key={event.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong>{eventLabel(event.event_type)}</strong>
                      <span className="text-xs text-ink-soft">
                        {formatDate(event.event_date)}
                        {event.odometer != null ? " · " + formatKm(event.odometer) : ""}
                      </span>
                    </div>
                    <p className="mt-1">{event.details}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {completeness.missing.length ? (
            <section className="diagnostic-report-section rounded-2xl border border-warning/40 bg-warning/5 p-4">
              <h2 className="font-semibold">بيانات ينصح باستكمالها قبل اعتماد التقرير</h2>
              <p className="mt-2 text-sm text-ink-soft">{completeness.missing.join("، ")}</p>
            </section>
          ) : null}

          <footer className="border-t border-border pt-4 text-xs leading-6 text-ink-soft">
            التقرير مبني على البيانات والفحوص المسجلة داخل النظام. أي اقتراح ذكي أو تفسير آلي يظل
            استرشاديًا، ويجب اعتماد التشخيص النهائي والإصلاح بواسطة فني مؤهل وبناءً على القياسات
            الفعلية للمركبة.
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <p className="text-[11px] text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-medium" dir={dir}>
        {value}
      </p>
    </div>
  );
}

function ReportText({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value?.trim()) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-7">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-border p-2 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-border p-2 leading-6">{children}</td>;
}

function eventLabel(type: DiagnosticIssue["events"][number]["event_type"]) {
  if (type === "observed") return "ملاحظة";
  if (type === "tested") return "فحص / اختبار";
  if (type === "repaired") return "إصلاح";
  if (type === "returned") return "عودة العطل";
  return "ملاحظة عامة";
}
