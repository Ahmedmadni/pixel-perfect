import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { QueryErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/types/vehicle";
import { useDiagnosticIssues } from "../hooks/useDiagnostics";
import { DIAGNOSTIC_SEVERITY_LABELS, DIAGNOSTIC_STATUS_LABELS, sortDiagnostics, summarizeDiagnostics } from "../lib/analytics";

export function DiagnosticAlertCard({vehicle}:{vehicle:Vehicle}){
  const q=useDiagnosticIssues(vehicle.id);
  if(q.isPending)return <Skeleton className="h-44 w-full rounded-2xl"/>;
  if(q.isError)return <QueryErrorState error={q.error} onRetry={()=>q.refetch()}/>;
  const issues=sortDiagnostics(q.data??[]);
  const summary=summarizeDiagnostics(issues);
  const top=issues.find(issue=>issue.status!=="resolved");
  return <section className="rounded-2xl bg-panel p-4 ring-1 ring-border">
    <div className="flex items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-accent"/> الأعطال والتنبيهات</p><p className="num mt-3 text-3xl font-semibold">{summary.active}</p><p className="mt-1 text-xs text-ink-soft">عطل نشط · {summary.critical} حرج</p></div>
      <Link to="/vehicles/$vehicleId" params={{vehicleId:vehicle.id}} search={{tab:"diagnostics"}} className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep">التفاصيل <ArrowLeft className="size-3.5"/></Link>
    </div>
    {top?<div className="mt-4 rounded-xl bg-secondary p-3"><p className="text-sm font-medium">{top.title}</p><p className="mt-1 text-xs text-ink-soft">{DIAGNOSTIC_STATUS_LABELS[top.status]} · خطورة {DIAGNOSTIC_SEVERITY_LABELS[top.severity]}{top.obd_codes.length?" · "+top.obd_codes.join(", "):""}</p></div>:<p className="mt-4 rounded-xl bg-success/5 p-3 text-sm text-success">لا توجد أعطال نشطة مسجلة.</p>}
  </section>;
}
