/** Pure odometer business rules — no UI, no data access. */

export type OdometerEvaluation =
  | { kind: "invalid"; message: string }
  | { kind: "current"; newCurrent: number; delta: number }
  | { kind: "historical"; message: string };

export const HISTORICAL_READING_MESSAGE =
  "تم تسجيل القراءة كسجل تاريخي لأن القراءة أقل من أو تساوي العداد الحالي.";

export function evaluateReading(reading: number, currentOdometer: number): OdometerEvaluation {
  if (!Number.isFinite(reading) || !Number.isInteger(reading)) {
    return { kind: "invalid", message: "القراءة يجب أن تكون رقمًا صحيحًا." };
  }
  if (reading < 0) {
    return { kind: "invalid", message: "لا يمكن أن تكون قراءة العداد سالبة." };
  }
  if (reading > currentOdometer) {
    return { kind: "current", newCurrent: reading, delta: reading - currentOdometer };
  }
  return { kind: "historical", message: HISTORICAL_READING_MESSAGE };
}

/** Difference between each reading and the previous one (chronological). */
export function withDeltas<T extends { reading: number; reading_date: string; created_at: string }>(
  readings: T[],
): Array<T & { delta: number | null }> {
  const sorted = [...readings].sort(
    (a, b) =>
      a.reading_date.localeCompare(b.reading_date) || a.created_at.localeCompare(b.created_at),
  );
  const out = sorted.map((r, i) => ({
    ...r,
    delta: i === 0 ? null : r.reading - sorted[i - 1].reading,
  }));
  return out.reverse();
}
