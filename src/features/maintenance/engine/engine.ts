/** Pure maintenance business rules — mirrored by DB triggers (compute_schedule_next_due / rebuild_maintenance_schedule). */
import { DUE_SOON_DAYS, DUE_SOON_KM, STATUS_PRIORITY, type MaintenanceStatus } from "./constants";

export interface ScheduleLike {
  interval_km: number | null;
  interval_months: number | null;
  last_service_date: string | null;
  last_service_odometer: number | null;
  is_enabled: boolean;
}

const DAY = 86_400_000;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Adds months like Postgres `date + interval 'n months'` (clamps to month end). */
export function addMonths(iso: string, months: number): string {
  const d = parseDate(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIsoDate(target);
}

export function calculateNextDue(s: Pick<ScheduleLike, "interval_km" | "interval_months" | "last_service_date" | "last_service_odometer">) {
  return {
    next_due_odometer:
      s.interval_km != null && s.last_service_odometer != null ? s.last_service_odometer + s.interval_km : null,
    next_due_date:
      s.interval_months != null && s.last_service_date ? addMonths(s.last_service_date, s.interval_months) : null,
  };
}

export function calculateKmRemaining(nextDueOdometer: number | null, currentOdometer: number): number | null {
  return nextDueOdometer == null ? null : nextDueOdometer - currentOdometer;
}

export function calculateDaysRemaining(nextDueDate: string | null, today: string): number | null {
  if (!nextDueDate) return null;
  return Math.round((parseDate(nextDueDate).getTime() - parseDate(today).getTime()) / DAY);
}

function single(remaining: number | null, soon: number): MaintenanceStatus | null {
  if (remaining == null) return null;
  if (remaining < 0) return "OVERDUE";
  if (remaining === 0) return "DUE";
  if (remaining <= soon) return "DUE_SOON";
  return "OK";
}

export interface MaintenanceEvaluation {
  status: MaintenanceStatus;
  kmRemaining: number | null;
  daysRemaining: number | null;
  next_due_odometer: number | null;
  next_due_date: string | null;
  /** Which trigger drives the status: km, time, or both. */
  reason: "km" | "time" | "both" | null;
}

/** Km OR time — whichever comes first. */
export function calculateMaintenanceStatus(
  s: ScheduleLike,
  currentOdometer: number,
  today: string = toIsoDate(new Date()),
): MaintenanceEvaluation {
  const next = calculateNextDue(s);
  const kmRemaining = calculateKmRemaining(next.next_due_odometer, currentOdometer);
  const daysRemaining = calculateDaysRemaining(next.next_due_date, today);
  const base = { ...next, kmRemaining, daysRemaining };
  if (!s.is_enabled) return { ...base, status: "DISABLED", reason: null };
  if (s.last_service_date == null && s.last_service_odometer == null)
    return { ...base, status: "NO_HISTORY", reason: null };
  const k = single(kmRemaining, DUE_SOON_KM);
  const t = single(daysRemaining, DUE_SOON_DAYS);
  if (!k && !t) return { ...base, status: "NO_HISTORY", reason: null };
  const kp = k ? STATUS_PRIORITY[k] : 99;
  const tp = t ? STATUS_PRIORITY[t] : 99;
  const status = (kp <= tp ? k : t)!;
  const reason = kp === tp ? "both" : kp < tp ? "km" : "time";
  return { ...base, status, reason };
}

export function describeRemaining(e: MaintenanceEvaluation): string[] {
  const out: string[] = [];
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  if (e.status === "OVERDUE") {
    if (e.kmRemaining != null && e.kmRemaining < 0) out.push(`متأخرة ${fmt(-e.kmRemaining)} كم`);
    if (e.daysRemaining != null && e.daysRemaining < 0) out.push(`متأخرة ${fmt(-e.daysRemaining)} يومًا`);
    return out;
  }
  if (e.status === "DUE") return ["مستحقة الآن"];
  if (e.status === "NO_HISTORY") return ["لم يتم تسجيل هذه الصيانة من قبل"];
  if (e.status === "DISABLED") return ["متوقفة"];
  if (e.kmRemaining != null) out.push(`متبقي ${fmt(e.kmRemaining)} كم`);
  if (e.daysRemaining != null) out.push(`متبقي ${fmt(e.daysRemaining)} يومًا`);
  return out;
}

/** Sort by priority, then nearest due (min of km/day-equivalents). */
export function sortByPriority<T extends { evaluation: MaintenanceEvaluation }>(rows: T[]): T[] {
  const nearest = (e: MaintenanceEvaluation) =>
    Math.min(e.kmRemaining ?? Infinity, e.daysRemaining != null ? e.daysRemaining * 50 : Infinity);
  return [...rows].sort(
    (a, b) =>
      STATUS_PRIORITY[a.evaluation.status] - STATUS_PRIORITY[b.evaluation.status] ||
      nearest(a.evaluation) - nearest(b.evaluation),
  );
}

/** Mirror of DB rebuild_maintenance_schedule: latest record wins, none -> NO_HISTORY. */
export function rebuildFromRecords(
  records: { service_date: string; odometer: number; created_at: string }[],
): { last_service_date: string | null; last_service_odometer: number | null } {
  const latest = [...records].sort(
    (a, b) =>
      b.service_date.localeCompare(a.service_date) || b.odometer - a.odometer || b.created_at.localeCompare(a.created_at),
  )[0];
  return { last_service_date: latest?.service_date ?? null, last_service_odometer: latest?.odometer ?? null };
}

/** Mirror of DB maintenance_record_after: odometer only moves forward. */
export function odometerAfterService(currentOdometer: number, serviceOdometer: number): number {
  return Math.max(currentOdometer, serviceOdometer);
}
