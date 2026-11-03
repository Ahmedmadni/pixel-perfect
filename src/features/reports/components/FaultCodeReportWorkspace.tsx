import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Printer, Sparkles, Cpu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/states";
import { OBD_CATEGORY_LABELS, type ObdCategory } from "@/features/diagnostics/services/obd-codes.service";
import { formatDate } from "@/lib/format";
import { maintenanceReportQuery } from "../services/maintenance-report.service";
import { buildFaultCodeReport } from "../lib/fault-code-report";
import { analyzeVehicleFaults, type FaultAnalysis } from "../lib/fault-analysis.functions";

const RISK: Record<FaultAnalysis["overall_risk"], string> = { low: "منخفض", medium: "متوسط", high: "مرتفع", critical: "حرج" };
const LIKE = { high: "مرجح", medium: "محتمل", low: "ضعيف" } as const;
const PRIO = { now: "فوراً", soon: "قريباً", later: "لاحقاً" } as const;

export function FaultCodeReportWorkspace({ vehicleId }: { vehicleId?: string | undefined }) {
  const { data } = useSuspenseQuery(maintenanceReportQuery);
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeVehicleFaults);
  const [ai, setAi] = useState<{ id: string; result: FaultAnalysis } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vehicle = data.vehicles.find(v => v.id === vehicleId) ?? data.vehicles.find(v => v.is_active) ?? data.vehicles[0];
  if (!vehicle) return <EmptyState icon={Cpu} title="لا توجد سيارة لإعداد التقرير" description="أضف سيارتك لعرض أكواد أعطالها." action={<Button asChild><Link to="/vehicles/new">إضافة سيارة</Link></Button>} />;
  const rows = buildFaultCodeReport(vehicle.id, data.issues, data.codes);
  const issueCount = data.issues.filter(i => i.vehicle_id === vehicle.id).length;
  const analysis = ai?.id === vehicle.id ? ai.result : null;

  async function run() {
    setLoading(true); setError(null);
    try { setAi({ id: vehicle!.id, result: await analyze({ data: { vehicleId: vehicle!.id } }) }); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذّر التحليل."); }
    finally { setLoading(false); }
  }

  return <div className="space-y-7" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Button variant="ghost" asChild><Link to="/reports"><ArrowRight /> التقارير</Link></Button>
      <label className="flex flex-wrap items-center gap-2 text-sm">السيارة
        <select aria-label="السيارة في تقرير الأعطال" className="max-w-full rounded-md border border-input bg-background p-2" value={vehicle.id} onChange={e => navigate({ to: "/reports/fault-codes", search: { vehicleId: e.target.value } })}>
          {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>
      <Button variant="outline" onClick={() => window.print()}><Printer /> طباعة / حفظ PDF</Button>
    </div>
    <header className="border-b border-border pb-5">
      <p className="text-sm text-brand-deep">كمتر · تقرير أكواد الأعطال</p>
      <h2 className="mt-2 text-2xl font-semibold break-words">{vehicle.name}</h2>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>الأعطال المسجلة: {issueCount}</span><span>الأكواد المختلفة: {rows.length}</span><span>أكواد نشطة: {rows.filter(r => r.activeOccurrences > 0).length}</span></div>
    </header>

    <section>
      <h3 className="mb-3 text-lg font-semibold">أكواد OBD-II</h3>
      {rows.length === 0 ? <EmptyState icon={Cpu} title="لا توجد أكواد مسجلة" description="سجّل عطلاً مع كوده من صفحة الأعطال ليظهر هنا." /> :
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-right"><tr><th className="p-2">الكود</th><th className="p-2">الوصف</th><th className="p-2">الفئة</th><th className="p-2">التكرار</th><th className="p-2">الحالة</th><th className="p-2">أول/آخر ظهور</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.code} className="border-t border-border align-top">
            <td className="p-2 font-mono font-semibold" dir="ltr">{r.code}</td>
            <td className="p-2" dir="ltr">{r.description ?? "غير موجود في المكتبة"}<div className="mt-1 text-xs text-ink-soft" dir="rtl">{r.issueTitles.join("، ")}</div></td>
            <td className="p-2">{OBD_CATEGORY_LABELS[r.category as ObdCategory] ?? r.category}</td>
            <td className="p-2">{r.occurrences}</td>
            <td className="p-2">{r.activeOccurrences > 0 ? <span className="text-accent">نشط ({r.activeOccurrences})</span> : "محلول"}</td>
            <td className="p-2 whitespace-nowrap">{formatDate(r.firstSeen)}<br />{formatDate(r.lastSeen)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>

    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="text-brand" /> تحليل الأعطال بالذكاء الاصطناعي</h3>
        <Button className="print:hidden" onClick={run} disabled={loading || issueCount === 0}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {analysis ? "إعادة التحليل" : "حلّل الأعطال"}</Button>
      </div>
      {issueCount === 0 && <p className="mt-3 text-sm text-ink-soft">لا توجد أعطال مسجلة لتحليلها.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {analysis && <div className="mt-4 space-y-5 text-sm">
        <p className="leading-7">{analysis.summary}</p>
        <p>مستوى الخطورة العام: <strong>{RISK[analysis.overall_risk] ?? analysis.overall_risk}</strong></p>
        {analysis.patterns.length > 0 && <div><h4 className="mb-2 font-semibold">الأنماط المتكررة</h4><ul className="space-y-2">{analysis.patterns.map((p, i) => <li key={i}><strong>{p.title}</strong> <span className="font-mono" dir="ltr">{p.codes.join(", ")}</span><p className="text-ink-soft">{p.explanation}</p></li>)}</ul></div>}
        {analysis.root_causes.length > 0 && <div><h4 className="mb-2 font-semibold">الأسباب الجذرية المحتملة</h4><ul className="space-y-1">{analysis.root_causes.map((c, i) => <li key={i}>• {c.cause} — {LIKE[c.likelihood] ?? c.likelihood} <span className="font-mono text-xs" dir="ltr">{c.related_codes.join(", ")}</span></li>)}</ul></div>}
        {analysis.recommendations.length > 0 && <div><h4 className="mb-2 font-semibold">التوصيات</h4><ol className="space-y-2">{analysis.recommendations.map((r, i) => <li key={i}><strong>{r.action}</strong> ({PRIO[r.priority] ?? r.priority})<p className="text-ink-soft">{r.details}</p></li>)}</ol></div>}
        <p className="text-xs text-ink-soft">{analysis.disclaimer}</p>
      </div>}
    </section>
  </div>;
}
