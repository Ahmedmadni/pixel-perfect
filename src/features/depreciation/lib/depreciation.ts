/** Straight-line depreciation starting from the purchase date (not model year). */
import { DEFAULT_SALVAGE_VALUE, DEFAULT_USEFUL_LIFE_YEARS } from "./config";

export { DEFAULT_SALVAGE_VALUE, DEFAULT_USEFUL_LIFE_YEARS };

export interface DepreciationRow {
  year: number;
  periodEnd: string;
  expense: number;
  accumulated: number;
  bookValue: number;
}

export interface Elapsed {
  years: number;
  months: number;
  totalMonths: number;
}

export interface DepreciationSchedule {
  cost: number;
  salvage: number;
  depreciable: number;
  usefulLife: number;
  annual: number;
  monthly: number;
  rows: DepreciationRow[];
  currentBookValue: number;
  currentAccumulated: number;
  elapsed: Elapsed;
  fullyDepreciated: boolean;
}

export type DepreciationResult =
  | { status: "missing_data" }
  | { status: "not_depreciable"; cost: number }
  | { status: "ok"; schedule: DepreciationSchedule };

const round2 = (n: number) => Math.round(n * 100) / 100;

function parseDate(iso: string): Date | null {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

/** Whole calendar months elapsed between two dates (partial month not counted). */
export function elapsedSince(start: Date, today: Date): Elapsed {
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (t <= start.getTime()) return { years: 0, months: 0, totalMonths: 0 };
  let total =
    (today.getFullYear() - start.getUTCFullYear()) * 12 + (today.getMonth() - start.getUTCMonth());
  if (today.getDate() < start.getUTCDate()) total -= 1;
  total = Math.max(total, 0);
  return { years: Math.floor(total / 12), months: total % 12, totalMonths: total };
}

export function formatElapsed(e: Elapsed): string {
  const y = e.years === 0 ? "" : e.years === 1 ? "سنة" : e.years === 2 ? "سنتان" : e.years <= 10 ? `${e.years} سنوات` : `${e.years} سنة`;
  const m = e.months === 0 ? "" : e.months === 1 ? "شهر" : e.months === 2 ? "شهران" : `${e.months} أشهر`;
  if (!y && !m) return "أقل من شهر";
  return [y, m].filter(Boolean).join(" و");
}

export function calculateDepreciation(
  purchasePrice: number | null,
  purchaseDate: string | null,
  today: Date = new Date(),
  usefulLife = DEFAULT_USEFUL_LIFE_YEARS,
  salvage = DEFAULT_SALVAGE_VALUE,
): DepreciationResult {
  if (purchasePrice === null || !purchaseDate || !Number.isFinite(purchasePrice)) return { status: "missing_data" };
  const start = parseDate(purchaseDate);
  if (!start) return { status: "missing_data" };
  if (purchasePrice <= salvage) return { status: "not_depreciable", cost: purchasePrice };

  const depreciable = purchasePrice - salvage;
  const annual = depreciable / usefulLife;
  const monthly = annual / 12;
  const rows: DepreciationRow[] = [];
  for (let y = 1; y <= usefulLife; y++) {
    const accumulated = y === usefulLife ? depreciable : annual * y;
    rows.push({
      year: y,
      periodEnd: addMonths(start, y * 12).toISOString().slice(0, 10),
      expense: round2(y === usefulLife ? depreciable - annual * (usefulLife - 1) : annual),
      accumulated: round2(accumulated),
      bookValue: round2(purchasePrice - accumulated),
    });
  }

  const elapsed = elapsedSince(start, today);
  const cappedMonths = Math.min(elapsed.totalMonths, usefulLife * 12);
  const fullyDepreciated = cappedMonths >= usefulLife * 12;
  const currentAccumulated = fullyDepreciated ? depreciable : Math.min(monthly * cappedMonths, depreciable);

  return {
    status: "ok",
    schedule: {
      cost: purchasePrice,
      salvage,
      depreciable,
      usefulLife,
      annual: round2(annual),
      monthly: round2(monthly),
      rows,
      currentAccumulated: round2(currentAccumulated),
      currentBookValue: round2(Math.max(purchasePrice - currentAccumulated, salvage)),
      elapsed,
      fullyDepreciated,
    },
  };
}

/** Convenience: current book value or null when not computable. */
export function currentBookValue(price: number | null, date: string | null): number | null {
  const r = calculateDepreciation(price, date);
  if (r.status === "ok") return r.schedule.currentBookValue;
  if (r.status === "not_depreciable") return r.cost;
  return null;
}
