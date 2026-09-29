import type { Likelihood, SymptomCause } from "../services/symptoms.service";

export interface ScheduleLike {
  maintenance_item_id: string; last_service_odometer: number | null; last_service_date: string | null;
  next_due_odometer: number | null; next_due_date: string | null;
}
export interface RankedCause { cause: SymptomCause; score: number; level: Likelihood; reasons: string[]; steps: string[]; }

const BASE: Record<Likelihood, number> = { low: 1, medium: 2, high: 3 };

/** يرتب أسباب العرض بناءً على سجل الصيانة وقراءة العداد الحالية، ويولّد خطوات الصيانة. */
export function rankCauses(
  causes: SymptomCause[], schedules: ScheduleLike[], currentOdometer: number,
  itemName: (id: string) => string, today = new Date().toLocaleDateString("en-CA"),
): RankedCause[] {
  return causes.map((cause) => {
    let score = BASE[cause.base_likelihood] ?? 2;
    const reasons: string[] = [];
    const steps = (cause.steps ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (cause.maintenance_item_id) {
      const name = itemName(cause.maintenance_item_id);
      const s = schedules.find((x) => x.maintenance_item_id === cause.maintenance_item_id);
      let flagged = false;
      if (!s || s.last_service_odometer == null) {
        score += 2; flagged = true; reasons.push(`لا يوجد سجل لصيانة "${name}".`);
      } else {
        const since = currentOdometer - s.last_service_odometer;
        if (s.next_due_odometer != null && currentOdometer >= s.next_due_odometer) {
          score += 2; flagged = true; reasons.push(`صيانة "${name}" متأخرة بـ ${(currentOdometer - s.next_due_odometer).toLocaleString("en")} كم.`);
        } else if (s.next_due_date && s.next_due_date <= today) {
          score += 2; flagged = true; reasons.push(`موعد صيانة "${name}" فات منذ ${s.next_due_date}.`);
        }
        if (cause.km_threshold && since >= cause.km_threshold) {
          score += 1; flagged = true; reasons.push(`مضى ${since.toLocaleString("en")} كم منذ آخر "${name}" (الحد ${cause.km_threshold.toLocaleString("en")} كم).`);
        }
        if (!flagged) { score -= 1; reasons.push(`"${name}" نُفذت مؤخراً عند ${s.last_service_odometer.toLocaleString("en")} كم.`); }
      }
      if (flagged) steps.unshift(`نفّذ صيانة "${name}" وسجّلها في التطبيق.`);
      else steps.push(`إن استمر العرض، افحص "${name}" رغم صيانتها مؤخراً.`);
    }
    if (!steps.length) steps.push("افحص السبب لدى فني مختص.");
    const level: Likelihood = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
    return { cause, score, level, reasons, steps };
  }).sort((a, b) => b.score - a.score);
}
