import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { useMaintenanceItems, useMaintenanceSchedules } from "@/features/maintenance/hooks/useMaintenance";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { errorMessage } from "@/lib/data-provider";
import { rankCauses, type ScheduleLike } from "../lib/symptom-rules";
import { deleteCause, deleteSymptom, getSymptoms, saveCause, saveSymptom, type Likelihood, type Symptom } from "../services/symptoms.service";

const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm";
const likeLabel: Record<Likelihood, string> = { high: "مرجّح", medium: "محتمل", low: "أقل احتمالاً" };
const likeTone = { high: "danger", medium: "warning", low: "neutral" } as const;

export function SymptomsWorkspace() {
  const qc = useQueryClient();
  const symptomsQ = useQuery({ queryKey: ["symptoms"], queryFn: getSymptoms, retry: false });
  const vehiclesQ = useVehicles();
  const itemsQ = useMaintenanceItems();
  const vehicles = vehiclesQ.data ?? [];
  const [vid, setVid] = useState("");
  const vehicle = vehicles.find((v) => v.id === vid) ?? vehicles.find((v) => v.is_active) ?? vehicles[0];
  const schedulesQ = useMaintenanceSchedules(vehicle?.id);
  const [selId, setSelId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const inv = () => qc.invalidateQueries({ queryKey: ["symptoms"] });
  const onErr = (e: unknown) => toast.error(errorMessage(e));
  const addSym = useMutation({ mutationFn: () => saveSymptom({ name: newName.trim(), description: null, category: null }), onSuccess: () => { setNewName(""); inv(); toast.success("تمت إضافة العرض"); }, onError: onErr });
  const delSym = useMutation({ mutationFn: deleteSymptom, onSuccess: () => { setSelId(null); inv(); }, onError: onErr });

  const symptoms = symptomsQ.data ?? [];
  const selected = symptoms.find((s) => s.id === selId) ?? symptoms[0];
  const items = itemsQ.data ?? [];
  const itemName = (id: string) => items.find((i) => i.id === id)?.name_ar ?? "صيانة";
  const ranked = useMemo(() => selected && vehicle
    ? rankCauses(selected.causes, (schedulesQ.data ?? []) as unknown as ScheduleLike[], vehicle.current_odometer, itemName)
    : [], [selected, vehicle, schedulesQ.data, items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (symptomsQ.isPending || vehiclesQ.isPending || itemsQ.isPending) return <CardsSkeleton count={4} />;
  const err = symptomsQ.error ?? vehiclesQ.error ?? itemsQ.error;
  if (err) return <QueryErrorState error={err} onRetry={() => { symptomsQ.refetch(); vehiclesQ.refetch(); itemsQ.refetch(); }} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-3 rounded-2xl bg-panel p-4 ring-1 ring-border">
        <p className="text-sm font-semibold">الأعراض</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newName.trim()) addSym.mutate(); }}>
          <input className={input} placeholder="مثال: اهتزاز عند الفرملة" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className={primaryBtn} disabled={addSym.isPending} aria-label="إضافة عرض"><Plus className="size-4" /></button>
        </form>
        {symptoms.length ? <ul className="space-y-1">{symptoms.map((s) => (
          <li key={s.id}><button onClick={() => setSelId(s.id)} className={"w-full rounded-xl px-3 py-2 text-right text-sm " + (selected?.id === s.id ? "bg-brand/10 font-medium text-brand" : "hover:bg-secondary")}>{s.name} <span className="text-xs text-ink-soft">({s.causes.length})</span></button></li>
        ))}</ul> : <p className="text-xs text-ink-soft">لا توجد أعراض بعد. أضف أول عرض.</p>}
      </aside>

      {selected ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-panel p-4 ring-1 ring-border">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <div className="flex gap-2">
              {vehicles.length > 1 ? <select className={input + " w-auto"} value={vehicle?.id} onChange={(e) => setVid(e.target.value)}>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select> : null}
              <ConfirmDialog title="حذف العرض؟" description="سيتم حذف العرض وكل أسبابه." confirmLabel="حذف" onConfirm={() => delSym.mutate(selected.id)} trigger={<button className={secondaryBtn + " text-destructive"}><Trash2 className="size-4" /> حذف</button>} />
            </div>
          </div>

          <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
            <div className="mb-3 flex items-center gap-2"><Stethoscope className="size-5 text-brand" /><h3 className="font-semibold">الاقتراحات لـ {vehicle?.name ?? "السيارة"}</h3></div>
            {!vehicle ? <p className="text-sm text-ink-soft">أضف سيارة لتظهر الاقتراحات.</p>
              : !ranked.length ? <p className="text-sm text-ink-soft">أضف أسباباً لهذا العرض لتظهر الاقتراحات.</p>
              : <ol className="space-y-3">{ranked.map((r) => (
                <li key={r.cause.id} className="rounded-xl bg-secondary/50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="font-medium">{r.cause.cause}</span><StatusBadge tone={likeTone[r.level]}>{likeLabel[r.level]}</StatusBadge></div>
                  {r.reasons.length ? <ul className="mt-1 list-disc pr-5 text-xs text-ink-soft">{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul> : null}
                  <p className="mt-2 text-xs font-medium">الخطوات المقترحة:</p>
                  <ol className="list-decimal pr-5 text-xs">{r.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
                </li>))}</ol>}
          </div>

          <CausesEditor symptom={selected} items={items.map((i) => ({ id: i.id, name: i.name_ar }))} onChange={inv} />
        </section>
      ) : <EmptyState icon={Stethoscope} title="لا توجد أعراض" description="أضف عرضاً من القائمة ثم اربطه بأسبابه وأنواع الصيانة." />}
    </div>
  );
}

function CausesEditor({ symptom, items, onChange }: { symptom: Symptom; items: { id: string; name: string }[]; onChange: () => void }) {
  const empty = { cause: "", maintenance_item_id: "", km_threshold: "", base_likelihood: "medium" as Likelihood, steps: "" };
  const [f, setF] = useState(empty);
  const save = useMutation({
    mutationFn: () => saveCause({ symptom_id: symptom.id, cause: f.cause.trim(), maintenance_item_id: f.maintenance_item_id || null, km_threshold: f.km_threshold ? Number(f.km_threshold) : null, base_likelihood: f.base_likelihood, steps: f.steps.trim() || null }),
    onSuccess: () => { setF(empty); onChange(); toast.success("تمت إضافة السبب"); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({ mutationFn: deleteCause, onSuccess: onChange, onError: (e) => toast.error(errorMessage(e)) });
  const name = (id: string | null) => items.find((i) => i.id === id)?.name;

  return (
    <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <h3 className="mb-3 font-semibold">الأسباب وقواعد الربط</h3>
      {symptom.causes.length ? <ul className="mb-4 space-y-2">{symptom.causes.map((c) => (
        <li key={c.id} className="flex items-start justify-between gap-2 rounded-xl border border-border p-3 text-sm">
          <div><p className="font-medium">{c.cause}</p><p className="text-xs text-ink-soft">{likeLabel[c.base_likelihood]}{c.maintenance_item_id ? ` · مرتبط بـ ${name(c.maintenance_item_id) ?? "صيانة"}` : ""}{c.km_threshold ? ` · الحد ${c.km_threshold.toLocaleString("en")} كم` : ""}</p></div>
          <button onClick={() => del.mutate(c.id)} aria-label="حذف السبب" className="opacity-60 hover:opacity-100"><Trash2 className="size-4" /></button>
        </li>))}</ul> : null}
      <form className="grid gap-2 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <input className={input + " sm:col-span-2"} placeholder="السبب (مثال: تآكل أقراص الفرامل)" value={f.cause} onChange={(e) => setF({ ...f, cause: e.target.value })} />
        <select className={input} value={f.maintenance_item_id} onChange={(e) => setF({ ...f, maintenance_item_id: e.target.value })}><option value="">بدون ربط بصيانة</option>{items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <input className={input} type="number" min={1} placeholder="حد الكيلومترات منذ آخر صيانة (اختياري)" value={f.km_threshold} onChange={(e) => setF({ ...f, km_threshold: e.target.value })} />
        <select className={input} value={f.base_likelihood} onChange={(e) => setF({ ...f, base_likelihood: e.target.value as Likelihood })}><option value="high">مرجّح</option><option value="medium">محتمل</option><option value="low">أقل احتمالاً</option></select>
        <textarea className={input + " sm:col-span-2"} rows={2} placeholder="خطوات الإصلاح (سطر لكل خطوة)" value={f.steps} onChange={(e) => setF({ ...f, steps: e.target.value })} />
        <button className={primaryBtn + " justify-self-start"} disabled={save.isPending || !f.cause.trim()}><Plus className="size-4" /> إضافة سبب</button>
      </form>
    </div>
  );
}
