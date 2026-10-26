import { Link } from "@tanstack/react-router";
import { ArrowLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/states";
import { DIAGNOSTIC_STATUS_LABELS } from "@/features/diagnostics/lib/analytics";
import { formatKm } from "@/lib/format";
import type { SymptomHistoryLink } from "../lib/history-links";

export function SymptomHistoryPanel({ link, vehicleId }: { link: SymptomHistoryLink; vehicleId: string }) {
  return <section className="space-y-4 border-t border-border pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">سجل السيارة المرتبط</h3>
      <StatusBadge tone={link.maintenanceDue ? "danger" : "neutral"}>
        {link.maintenanceDue ? "عطل نشط وصيانة مستحقة" : link.activeIssues.length ? "عطل يحتاج فحصاً" : "لا يوجد عطل نشط مرتبط"}
      </StatusBadge>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-medium">سجل الأعطال</h4>
        {link.linkedIssues.length ? <ul className="space-y-2">{link.linkedIssues.map((issue) => <li key={issue.id} className="border-b border-border pb-2 text-sm">
          <p className="font-medium">{issue.title}</p>
          <p className="text-xs text-ink-soft">{DIAGNOSTIC_STATUS_LABELS[issue.status]} · {issue.first_detected_date}</p>
          {issue.confirmed_cause ? <p className="mt-1 text-xs">السبب المؤكد: {issue.confirmed_cause}</p> : null}
          {issue.resolution ? <p className="mt-1 text-xs text-ink-soft">{issue.resolution}</p> : null}
        </li>)}</ul> : <p className="text-sm text-ink-soft">لا توجد أعطال مطابقة للأعراض أو مرتبطة بأعمال صيانتها.</p>}
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">آخر أعمال الصيانة</h4>
        {link.relatedRecords.length ? <ul className="space-y-2">{link.relatedRecords.slice(0, 5).map((record) => <li key={record.id} className="border-b border-border pb-2 text-sm">
          <p className="font-medium">{record.item?.name_ar ?? "صيانة"}</p>
          <p className="text-xs text-ink-soft">{record.service_date} · {formatKm(record.odometer)}</p>
          {record.notes ? <p className="mt-1 text-xs text-ink-soft">{record.notes}</p> : null}
        </li>)}</ul> : <p className="text-sm text-ink-soft">لم تُسجّل صيانة للأنواع المرتبطة بهذا العرض.</p>}
      </div>
    </div>
    {link.dueCauses.length ? <div className="border-r-2 border-accent pr-3">
      <p className="mb-1 text-sm font-medium">صيانة مستحقة مرتبطة بالأسباب المحتملة</p>
      <ul className="list-disc pr-4 text-xs text-ink-soft">{link.dueCauses.map((r) => <li key={r.cause.id}>{r.cause.cause}</li>)}</ul>
    </div> : null}
    <p className="text-xs text-ink-soft">الروابط النصية والأسباب المحتملة ليست تشخيصاً مؤكداً؛ اعتمد نتيجة الفحص قبل استبدال القطع.</p>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm"><Link to="/vehicles/$vehicleId" params={{ vehicleId }} search={{ tab: "diagnostics" }}>سجل الأعطال <ArrowLeft /></Link></Button>
      <Button asChild size="sm"><Link to="/vehicles/$vehicleId" params={{ vehicleId }} search={{ tab: "maintenance" }}><Wrench /> تسجيل صيانة</Link></Button>
    </div>
  </section>;
}