import { useState } from "react";
import { toast } from "sonner";
import { primaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { useCreateOdometerReading } from "../hooks/useOdometer";
import { evaluateReading } from "../lib/odometer-rules";

const inputCls =
  "w-full rounded-xl bg-background px-3 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-brand";

export function OdometerForm({ vehicleId, currentOdometer }: { vehicleId: string; currentOdometer: number }) {
  const [reading, setReading] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mutation = useCreateOdometerReading(vehicleId, currentOdometer);

  const preview = reading === "" ? null : evaluateReading(Number(reading), currentOdometer);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const evaluation = evaluateReading(Number(reading), currentOdometer);
    if (reading === "" || evaluation.kind === "invalid") {
      setError(reading === "" ? "أدخل قراءة العداد" : evaluation.kind === "invalid" ? evaluation.message : null);
      return;
    }
    setError(null);
    mutation.mutate(
      { vehicle_id: vehicleId, reading: Number(reading), reading_date: date, notes: notes.trim() || null },
      {
        onSuccess: ({ evaluation: ev }) => {
          if (ev.kind === "historical") toast.warning(ev.message);
          else toast.success("تم تحديث العداد الحالي");
          setReading("");
          setNotes("");
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl bg-panel p-5 ring-1 ring-border">
      <h3 className="mb-4 text-sm font-semibold text-brand-deep">تسجيل قراءة جديدة</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">القراءة (كم)</span>
          <input value={reading} onChange={(e) => setReading(e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" className={inputCls} aria-invalid={!!error} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">التاريخ</span>
          <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} dir="ltr" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">ملاحظات</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </label>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {!error && preview?.kind === "historical" ? (
        <p className="mt-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-foreground">{preview.message}</p>
      ) : null}
      <button type="submit" disabled={mutation.isPending} className={`${primaryBtn} mt-4`}>
        {mutation.isPending ? "جارٍ الحفظ..." : "حفظ القراءة"}
      </button>
    </form>
  );
}
