import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Printer, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/states";
import { DIAGNOSTIC_STATUS_LABELS } from "@/features/diagnostics/lib/analytics";
import { PART_STATUS_LABELS } from "@/features/parts/lib/analytics";
import { formatCurrency, formatDate, formatKm } from "@/lib/format";
import { maintenanceReportQuery } from "../services/maintenance-report.service";
import { buildMaintenanceReport, installationCost, serviceCost } from "../lib/maintenance-report";

export function MaintenanceReportWorkspace({ vehicleId }: { vehicleId?: string | undefined }) {
  const { data } = useSuspenseQuery(maintenanceReportQuery);
  const navigate = useNavigate();
  const vehicle = data.vehicles.find(v => v.id === vehicleId) ?? data.vehicles.find(v => v.is_active) ?? data.vehicles[0];
  if (!vehicle) return <EmptyState icon={Wrench} title="لا توجد سيارة لإعداد التقرير" description="أضف سيارتك لعرض سجل صيانتها." action={<Button asChild><Link to="/vehicles/new">إضافة سيارة</Link></Button>} />;
  const report = buildMaintenanceReport(vehicle.id, data.records, data.issues, data.installations);
  const catalog = data.parts.filter(p => p.fitments.some(f => f.vehicle_id === vehicle.id) || report.parts.some(i => i.part_id === p.id));
  return <div className="space-y-7" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Button variant="ghost" asChild><Link to="/reports"><ArrowRight /> التقارير</Link></Button>
      <label className="flex flex-wrap items-center gap-2 text-sm">السيارة
        <select aria-label="السيارة في تقرير الصيانة" className="max-w-full rounded-md border border-input bg-background p-2" value={vehicle.id} onChange={e => navigate({ to: "/reports/maintenance", search: { vehicleId: e.target.value } })}>
          {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>
      <Button variant="outline" onClick={() => window.print()}><Printer /> طباعة / حفظ PDF</Button>
    </div>
    <header className="border-b border-border pb-5">
      <p className="text-sm text-brand-deep">كمتر · تقرير الصيانة الشامل</p>
      <h2 className="mt-2 text-2xl font-semibold break-words">{vehicle.name}</h2>
      <p className="mt-2 text-sm text-ink-soft">{[vehicle.manufacturer, vehicle.model, vehicle.model_year].filter(Boolean).join(" · ") || "الموديل غير مسجل"}</p>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>العداد: {formatKm(vehicle.current_odometer)}</span><span>اللوحة: {vehicle.plate_number || "—"}</span><span className="break-all">رقم الهيكل: {vehicle.vin || "—"}</span><span>تاريخ التقرير: {formatDate(new Date().toISOString())}</span></div>
    </header>
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Metric label="إجمالي الصيانة والقطع المستقلة" value={formatCurrency(report.total)} />
      <Metric label="تكلفة سجلات الصيانة" value={formatCurrency(report.maintenanceCost)} />
      <Metric label="قطع مستقلة عن الصيانة" value={formatCurrency(report.independentPartsCost)} />
      <Metric label="أعمال الصيانة / الأعطال" value={`${report.services.length} / ${report.faults.length}`} />
    </dl>
    {report.linkedPartsCost > 0 && <p className="border-r-2 border-accent pr-3 text-sm text-ink-soft">قيمة القطع المرتبطة بالصيانة: {formatCurrency(report.linkedPartsCost)}، معروضة منفصلة ولا تُضاف مرة أخرى للإجمالي؛ الإجمالي يفترض احتسابها ضمن تكلفة سجل الصيانة.</p>}
    <Section title="سجل الصيانة الكامل" count={report.services.length}>
      <ReportTable headers={["التاريخ", "الصيانة / الورشة", "العداد", "قطع", "أجور", "أخرى", "الإجمالي"]}>
        {report.services.map(r => <tr key={r.id}><td>{formatDate(r.service_date)}</td><td>{r.item?.name_ar || "صيانة"}<p className="text-ink-soft">{r.workshop_name || "—"}</p>{r.notes && <p className="whitespace-pre-wrap text-ink-soft">{r.notes}</p>}</td><td>{formatKm(r.odometer)}</td><td>{formatCurrency(r.parts_cost)}</td><td>{formatCurrency(r.labor_cost)}</td><td>{formatCurrency(r.other_cost)}</td><td>{formatCurrency(serviceCost(r))}</td></tr>)}
      </ReportTable>
    </Section>
    <Section title="سجل الأعطال وأكواد OBD-II" count={report.faults.length}>
      <div className="divide-y divide-border">{report.faults.map(issue => <article key={issue.id} className="py-4 break-inside-avoid">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-medium">{issue.title}</h3><span className="text-sm text-brand-deep">{DIAGNOSTIC_STATUS_LABELS[issue.status]}</span></div>
        <p className="mt-1 text-xs text-ink-soft">{formatDate(issue.first_detected_date)}{issue.first_odometer != null && ` · ${formatKm(issue.first_odometer)}`}</p>
        {issue.symptoms && <p className="mt-2 whitespace-pre-wrap text-sm">{issue.symptoms}</p>}
        <ul className="mt-2 space-y-1 text-sm">{issue.obd_codes.map(code => <li key={code}><code className="font-display text-brand-deep">{code}</code> — {data.codes.find(c => c.code === code)?.description || "الوصف غير متاح في مكتبة الأكواد"}</li>)}</ul>
        {issue.confirmed_cause && <p className="mt-2 text-sm">السبب المؤكد: {issue.confirmed_cause}</p>}
        {(issue.repair_actions || issue.resolution) && <p className="mt-2 whitespace-pre-wrap text-sm">الإصلاح: {issue.repair_actions || issue.resolution}</p>}
        {issue.verification_result && <p className="mt-2 text-sm">التحقق: {issue.verification_result}</p>}
        {issue.tests.map(test => <p key={test.id} className="mt-2 text-sm text-ink-soft">فحص: {test.test_name} — {test.actual_result || "—"}</p>)}
        {issue.events.map(event => <p key={event.id} className="mt-2 text-sm text-ink-soft">{formatDate(event.event_date)} — {event.details}</p>)}
      </article>)}</div>
    </Section>
    <Section title="سجل تركيب قطع الغيار" count={report.parts.length}>
      <ReportTable headers={["التاريخ", "القطعة / الرقم", "المورد", "العداد", "الكمية", "التكلفة", "الصيانة المرتبطة"]}>
        {report.parts.map(p => <tr key={p.id}><td>{formatDate(p.install_date)}</td><td>{p.part?.name_ar || "قطعة"}<p className="text-ink-soft">{p.part?.part_number || "—"}</p>{p.notes && <p className="text-ink-soft">{p.notes}</p>}</td><td>{p.supplier?.name || "—"}</td><td>{p.odometer == null ? "—" : formatKm(p.odometer)}</td><td>{p.quantity}</td><td>{formatCurrency(installationCost(p))}</td><td>{report.services.find(r => r.id === p.maintenance_record_id)?.item?.name_ar || "مستقلة"}</td></tr>)}
      </ReportTable>
    </Section>
    <Section title="قطع الغيار المرتبطة بالسيارة" count={catalog.length}>
      <ReportTable headers={["القطعة", "رقم القطعة", "الشركة", "الحالة"]}>{catalog.map(p => <tr key={p.id}><td>{p.name_ar}</td><td>{p.part_number || "—"}</td><td>{p.manufacturer || "—"}</td><td>{PART_STATUS_LABELS[p.status]}</td></tr>)}</ReportTable>
    </Section>
  </div>;
}
function Metric({label,value}:{label:string;value:string}) { return <div className="border-r-2 border-brand/30 pr-3"><dt className="text-xs text-ink-soft">{label}</dt><dd className="mt-2 text-xl font-semibold break-words">{value}</dd></div>; }
function Section({title,count,children}:{title:string;count:number;children:ReactNode}) { return <section className="border-t border-border pt-5"><h2 className="mb-4 text-lg font-semibold">{title} <span className="text-sm text-ink-soft">({count})</span></h2>{count ? children : <p className="py-4 text-sm text-ink-soft">لا توجد سجلات.</p>}</section>; }
function ReportTable({headers,children}:{headers:string[];children:ReactNode}) { return <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-right text-sm print:min-w-0"><thead className="bg-secondary"><tr>{headers.map(h => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-border [&_td]:px-3 [&_td]:py-3 [&_td]:align-top [&_td]:break-words">{children}</tbody></table></div>; }