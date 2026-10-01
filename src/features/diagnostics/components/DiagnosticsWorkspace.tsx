import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ClipboardCheck, ExternalLink, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { useMaintenanceRecords } from "@/features/maintenance/hooks/useMaintenance";
import { useParts } from "@/features/parts/hooks/useParts";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { errorMessage } from "@/lib/data-provider";
import { formatDate, formatKm } from "@/lib/format";
import { useDeleteDiagnosticEvent, useDeleteDiagnosticIssue, useDeleteDiagnosticTest, useDiagnosticIssues } from "../hooks/useDiagnostics";
import { DIAGNOSTIC_SEVERITY_LABELS, DIAGNOSTIC_STATUS_LABELS, sortDiagnostics, summarizeDiagnostics } from "../lib/analytics";
import { getDiagnosticDocumentUrl, type DiagnosticIssue, type DiagnosticSeverity, type DiagnosticStatus } from "../services/diagnostics.service";
import { DiagnosticEventForm } from "./DiagnosticEventForm";
import { DiagnosticIssueForm } from "./DiagnosticIssueForm";
import { DiagnosticTestForm } from "./DiagnosticTestForm";
import { DiagnosticReportDialog } from "./DiagnosticReportDialog";
import { AiSymptomAssistant } from "./AiSymptomAssistant";

const statusTone:Record<DiagnosticStatus,"danger"|"warning"|"success"|"brand">={open:"warning",monitoring:"brand",resolved:"success",returned:"danger"};
const severityTone:Record<DiagnosticSeverity,"neutral"|"warning"|"danger">={low:"neutral",medium:"neutral",high:"warning",critical:"danger"};

export function DiagnosticsWorkspace({vehicleId}:{vehicleId?:string}){
  const vehiclesQ=useVehicles();const partsQ=useParts();const maintenanceQ=useMaintenanceRecords();const issuesQ=useDiagnosticIssues(vehicleId);
  const delIssue=useDeleteDiagnosticIssue();const delEvent=useDeleteDiagnosticEvent();const delTest=useDeleteDiagnosticTest();
  const [query,setQuery]=useState("");const [status,setStatus]=useState<"all"|DiagnosticStatus>("all");const [severity,setSeverity]=useState<"all"|DiagnosticSeverity>("all");const [vehicleFilter,setVehicleFilter]=useState(vehicleId??"all");
  const [issueOpen,setIssueOpen]=useState(false);const [eventOpen,setEventOpen]=useState(false);const [selected,setSelected]=useState<DiagnosticIssue|null>(null);
  const [testOpen,setTestOpen]=useState(false);const [testIssue,setTestIssue]=useState<DiagnosticIssue|null>(null);
  const [selectedTest,setSelectedTest]=useState<DiagnosticIssue["tests"][number]|null>(null);
  const [reportOpen,setReportOpen]=useState(false);const [reportIssue,setReportIssue]=useState<DiagnosticIssue|null>(null);

  const loading=vehiclesQ.isPending||partsQ.isPending||maintenanceQ.isPending||issuesQ.isPending;
  const error=vehiclesQ.error??partsQ.error??maintenanceQ.error??issuesQ.error;
  const issues=sortDiagnostics(issuesQ.data??[]);const summary=useMemo(()=>summarizeDiagnostics(issues),[issues]);
  const filtered=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return issues.filter(i=>{
      if(vehicleFilter!=="all"&&i.vehicle_id!==vehicleFilter)return false;
      if(status!=="all"&&i.status!==status)return false;
      if(severity!=="all"&&i.severity!==severity)return false;
      if(!needle)return true;
      return [i.title,i.symptoms??"",i.suspected_cause??"",i.confirmed_cause??"",i.resolution??"",...i.obd_codes].some(v=>v.toLowerCase().includes(needle));
    });
  },[issues,vehicleFilter,status,severity,query]);

  const openDoc=async(path:string)=>{const tab=window.open("about:blank","_blank");if(tab)tab.opener=null;try{const url=await getDiagnosticDocumentUrl(path);if(tab)tab.location.href=url;else window.location.assign(url);}catch(e){tab?.close();toast.error(errorMessage(e));}};

  if(loading)return <CardsSkeleton count={6}/>;
  if(error)return <QueryErrorState error={error} onRetry={()=>{vehiclesQ.refetch();partsQ.refetch();maintenanceQ.refetch();issuesQ.refetch();}}/>;
  if(!(vehiclesQ.data??[]).length)return <EmptyState title="لا توجد سيارة" description="أضف سيارة أولًا ثم ابدأ توثيق الأعطال."/>;

  return <div className="space-y-6">
    <AiSymptomAssistant vehicles={vehiclesQ.data??[]} vehicleId={vehicleId}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Summary label="أعطال نشطة" value={summary.active}/><Summary label="عادت مرة أخرى" value={summary.returned}/><Summary label="حرجة" value={summary.critical}/><Summary label="تم حلها" value={summary.resolved}/></div>
    <div className="flex flex-col gap-2 rounded-2xl bg-panel p-4 ring-1 ring-border xl:flex-row">
      <label className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"/><input className="w-full rounded-xl border border-border bg-background py-2.5 pr-9 pl-3 text-sm" placeholder="ابحث بالعرض أو الكود أو السبب..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
      {!vehicleId?<select className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" value={vehicleFilter} onChange={e=>setVehicleFilter(e.target.value)}><option value="all">كل السيارات</option>{(vehiclesQ.data??[]).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>:null}
      <select className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" value={status} onChange={e=>setStatus(e.target.value as "all"|DiagnosticStatus)}><option value="all">كل الحالات</option>{(Object.keys(DIAGNOSTIC_STATUS_LABELS) as DiagnosticStatus[]).map(s=><option key={s} value={s}>{DIAGNOSTIC_STATUS_LABELS[s]}</option>)}</select>
      <select className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" value={severity} onChange={e=>setSeverity(e.target.value as "all"|DiagnosticSeverity)}><option value="all">كل الدرجات</option>{(Object.keys(DIAGNOSTIC_SEVERITY_LABELS) as DiagnosticSeverity[]).map(s=><option key={s} value={s}>{DIAGNOSTIC_SEVERITY_LABELS[s]}</option>)}</select>
      <button className={primaryBtn} onClick={()=>{setSelected(null);setIssueOpen(true);}}><Plus className="size-4"/> تسجيل عطل</button>
    </div>

    {filtered.length?<div className="space-y-4">{filtered.map(issue=><article key={issue.id} className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{issue.title}</h3><StatusBadge tone={statusTone[issue.status]}>{DIAGNOSTIC_STATUS_LABELS[issue.status]}</StatusBadge><StatusBadge tone={severityTone[issue.severity]}>{DIAGNOSTIC_SEVERITY_LABELS[issue.severity]}</StatusBadge></div><p className="mt-1 text-xs text-ink-soft">{issue.vehicle?.name??"السيارة"} · {formatDate(issue.first_detected_date)}{issue.first_odometer!=null?" · "+formatKm(issue.first_odometer):""}</p></div>{issue.obd_codes.length?<div className="flex flex-wrap gap-1">{issue.obd_codes.map(c=><code key={c} className="rounded-lg bg-secondary px-2 py-1 text-xs">{c}</code>)}</div>:null}</div>
      {issue.symptoms?<p className="mt-3 text-sm"><span className="text-ink-soft">الأعراض: </span>{issue.symptoms}</p>:null}
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{issue.suspected_cause?<p><span className="text-ink-soft">سبب محتمل: </span>{issue.suspected_cause}</p>:null}{issue.confirmed_cause?<p><span className="text-ink-soft">سبب مؤكد: </span>{issue.confirmed_cause}</p>:null}{issue.part?<p><span className="text-ink-soft">قطعة مرتبطة: </span>{issue.part.name_ar}</p>:null}{issue.maintenance?<p><span className="text-ink-soft">صيانة مرتبطة: </span>{issue.maintenance.item?.name_ar??"صيانة"} · {formatDate(issue.maintenance.service_date)}</p>:null}</div>
      {issue.status==="resolved"&&(issue.repair_actions||issue.resolution)?<div className="mt-3 rounded-xl bg-success/5 p-3 text-sm"><span className="font-medium">الحل: </span>{issue.repair_actions||issue.resolution}</div>:null}

      {issue.tests.length?<div className="mt-4 rounded-xl border border-border p-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-medium">خطوات الفحص المنظمة</p><span className="text-[11px] text-ink-soft">{issue.tests.length} خطوة</span></div><div className="space-y-2">{issue.tests.slice(0,4).map(test=><div key={test.id} className="flex items-start justify-between gap-2 rounded-lg bg-secondary/50 p-2"><button type="button" className="min-w-0 flex-1 text-right" onClick={()=>{setTestIssue(issue);setSelectedTest(test);setTestOpen(true);}}><p className="text-xs font-medium">{test.sequence_no}. {test.test_name}</p><p className="mt-0.5 text-[11px] text-ink-soft">{test.system_area?test.system_area+" · ":""}{test.result_status==="pass"?"طبيعي":test.result_status==="fail"?"غير طبيعي":"غير حاسم"}{test.conclusion?" — "+test.conclusion:""}</p></button><ConfirmDialog title="حذف خطوة الفحص؟" description="سيتم حذف هذه الخطوة من مسار التشخيص والتقرير." confirmLabel="حذف" onConfirm={()=>delTest.mutate(test.id,{onSuccess:()=>toast.success("تم حذف خطوة الفحص"),onError:e=>toast.error(errorMessage(e))})} trigger={<button className="opacity-60 hover:opacity-100"><Trash2 className="size-3.5"/></button>}/></div>)}</div></div>:null}

      {issue.events.length?<div className="mt-4 border-r-2 border-border pr-3"><p className="mb-2 text-xs font-medium">السجل الزمني</p><div className="space-y-2">{issue.events.slice(0,5).map(event=><div key={event.id} className="group flex items-start justify-between gap-2 rounded-xl bg-secondary/50 p-2"><div><p className="text-xs font-medium">{event.event_type==="repaired"?"إصلاح":event.event_type==="returned"?"عودة العطل":event.event_type==="tested"?"فحص/اختبار":event.event_type==="observed"?"ملاحظة جديدة":"ملاحظة"}</p><p className="mt-0.5 text-xs text-ink-soft">{formatDate(event.event_date)}{event.odometer!=null?" · "+formatKm(event.odometer):""} — {event.details}</p></div><ConfirmDialog title="حذف الحدث؟" description="سيتم حذف هذا السطر من السجل الزمني فقط." confirmLabel="حذف" onConfirm={()=>delEvent.mutate(event.id,{onSuccess:()=>toast.success("تم حذف الحدث"),onError:e=>toast.error(errorMessage(e))})} trigger={<button className="opacity-60 hover:opacity-100"><Trash2 className="size-3.5"/></button>}/></div>)}</div></div>:null}

      <div className="mt-4 flex flex-wrap gap-2">{issue.attachment_url?<button className={secondaryBtn} onClick={()=>openDoc(issue.attachment_url!)}><ExternalLink className="size-4"/> المرفق</button>:null}<button className={secondaryBtn} onClick={()=>{setTestIssue(issue);setSelectedTest(null);setTestOpen(true);}}><ClipboardCheck className="size-4"/> إضافة فحص</button><button className={primaryBtn} onClick={()=>{setReportIssue(issue);setReportOpen(true);}}><FileText className="size-4"/> التقرير الشامل</button><button className={secondaryBtn} onClick={()=>{setSelected(issue);setEventOpen(true);}}><Activity className="size-4"/> إضافة حدث</button><button className={secondaryBtn} onClick={()=>{setSelected(issue);setIssueOpen(true);}}><Pencil className="size-4"/> تعديل</button><ConfirmDialog title="حذف العطل؟" description="سيتم حذف العطل وسجله الزمني والمرفق. لا يمكن التراجع." confirmLabel="حذف" onConfirm={()=>delIssue.mutate(issue,{onSuccess:()=>toast.success("تم حذف العطل"),onError:e=>toast.error(errorMessage(e))})} trigger={<button className={secondaryBtn+" text-destructive"}><Trash2 className="size-4"/> حذف</button>}/></div>
    </article>)}</div>:<EmptyState icon={AlertTriangle} title="لا توجد أعطال مطابقة" description="غيّر الفلاتر أو سجل أول عطل." action={<button className={primaryBtn} onClick={()=>{setSelected(null);setIssueOpen(true);}}><Plus className="size-4"/> تسجيل عطل</button>}/>}

    <DiagnosticIssueForm open={issueOpen} onOpenChange={v=>{setIssueOpen(v);if(!v)setSelected(null);}} vehicles={vehiclesQ.data??[]} parts={partsQ.data??[]} maintenanceRecords={maintenanceQ.data??[]} vehicleId={vehicleId} issue={selected}/>
    <DiagnosticEventForm open={eventOpen} onOpenChange={v=>{setEventOpen(v);if(!v)setSelected(null);}} issue={selected}/>
    <DiagnosticTestForm open={testOpen} onOpenChange={v=>{setTestOpen(v);if(!v){setTestIssue(null);setSelectedTest(null);}}} issue={testIssue} test={selectedTest}/>
    <DiagnosticReportDialog open={reportOpen} onOpenChange={v=>{setReportOpen(v);if(!v)setReportIssue(null);}} issue={reportIssue} vehicle={(vehiclesQ.data??[]).find(v=>v.id===reportIssue?.vehicle_id)??null}/>
  </div>;
}
function Summary({label,value}:{label:string;value:number}){return <div className="rounded-2xl bg-panel p-4 ring-1 ring-border"><p className="text-xs text-ink-soft">{label}</p><p className="num mt-2 text-2xl font-semibold">{value}</p></div>;}
