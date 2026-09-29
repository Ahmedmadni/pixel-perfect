import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Stethoscope } from "lucide-react";
import { primaryBtn } from "@/components/common/buttons";
import { StatusBadge } from "@/components/common/states";
import { diagnoseSymptoms, type AiDiagnosis } from "../lib/ai-diagnosis.functions";

const urgencyLabel = { low: "منخفضة", medium: "متوسطة", high: "عالية", critical: "حرجة" } as const;
const urgencyTone = { low: "success", medium: "brand", high: "warning", critical: "danger" } as const;
const likeLabel = { high: "مرجّح", medium: "محتمل", low: "أقل احتمالاً" } as const;

export function AiSymptomAssistant({ vehicles, vehicleId }: { vehicles: { id: string; name: string }[]; vehicleId?: string | undefined }) {
  const [vid, setVid] = useState(vehicleId ?? vehicles[0]?.id ?? "");
  const [symptoms, setSymptoms] = useState("");
  const fn = useServerFn(diagnoseSymptoms);
  const m = useMutation({ mutationFn: () => fn({ data: { vehicleId: vid, symptoms } }) });
  const r: AiDiagnosis | undefined = m.data;

  return (
    <section className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex items-center gap-2"><Stethoscope className="size-5 text-brand" /><h3 className="font-semibold">المساعد الذكي للتشخيص</h3></div>
      <p className="mt-1 text-xs text-ink-soft">صف ما تلاحظه في السيارة وسنقترح أسباباً محتملة وخطوات مناسبة بناءً على سجلها.</p>
      <div className="mt-3 flex flex-col gap-2">
        {!vehicleId && vehicles.length > 1 ? (
          <select className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" value={vid} onChange={(e) => setVid(e.target.value)}>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        ) : null}
        <textarea rows={3} maxLength={2000} className="w-full rounded-xl border border-border bg-background p-3 text-sm" placeholder="مثال: صوت صرير عند الضغط على الفرامل، ولمبة المحرك تضيء عند التسارع..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        <button className={primaryBtn + " self-start"} disabled={m.isPending || symptoms.trim().length < 5 || !vid} onClick={() => m.mutate()}>
          {m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Stethoscope className="size-4" />} {m.isPending ? "جارٍ التحليل..." : "حلّل الأعراض"}
        </button>
      </div>
      {m.error ? <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{m.error.message}</p> : null}
      {r ? (
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={urgencyTone[r.urgency] ?? "brand"}>الأولوية: {urgencyLabel[r.urgency] ?? r.urgency}</StatusBadge>
            <StatusBadge tone={r.safe_to_drive ? "success" : "danger"}>{r.safe_to_drive ? "القيادة ممكنة بحذر" : "يُنصح بعدم القيادة"}</StatusBadge>
          </div>
          <p>{r.summary}</p>
          <div><p className="mb-2 font-medium">الأسباب المحتملة</p><ol className="space-y-2">{r.causes.map((c, i) => <li key={i} className="rounded-xl bg-secondary/50 p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{c.cause}</span><span className="text-xs text-ink-soft">{likeLabel[c.likelihood] ?? c.likelihood}</span></div><p className="mt-1 text-xs text-ink-soft">{c.reasoning}</p></li>)}</ol></div>
          <div><p className="mb-2 font-medium">خطوات الصيانة المقترحة</p><ol className="list-decimal space-y-1 pr-5">{r.steps.map((s, i) => <li key={i}><span className="font-medium">{s.step}</span> — <span className="text-ink-soft">{s.details}</span></li>)}</ol></div>
          {r.history_notes.length ? <div><p className="mb-2 font-medium">من سجل السيارة</p><ul className="list-disc space-y-1 pr-5 text-ink-soft">{r.history_notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div> : null}
          <p className="text-xs text-ink-soft">{r.disclaimer || "هذه اقتراحات استرشادية ولا تغني عن فحص فني مختص."}</p>
        </div>
      ) : null}
    </section>
  );
}
