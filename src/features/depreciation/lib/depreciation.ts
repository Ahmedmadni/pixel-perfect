/** Straight-line depreciation. Fixed policy: 25-year useful life, 3,000 SAR salvage. */
export const USEFUL_LIFE_YEARS = 25;
export const SALVAGE_VALUE_SAR = 3000;

export interface DepreciationRow {
  year: number; // 1..25
  periodEnd: string; // ISO date
  expense: number;
  accumulated: number;
  bookValue: number;
}

export interface DepreciationSchedule {
  cost: number;
  annual: number;
  monthly: number;
  rows: DepreciationRow[];
  currentBookValue: number;
  currentAccumulated: number;
  elapsedYears: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildDepreciationSchedule(
  purchasePrice: number,
  purchaseDate: string,
  today: Date = new Date(),
): DepreciationSchedule | null {
  if (!Number.isFinite(purchasePrice) || purchasePrice <= SALVAGE_VALUE_SAR) return null;
  const start = new Date(purchaseDate);
  if (Number.isNaN(start.getTime())) return null;

  const depreciable = purchasePrice - SALVAGE_VALUE_SAR;
  const annual = depreciable / USEFUL_LIFE_YEARS;
  const rows: DepreciationRow[] = [];
  let accumulated = 0;
  for (let y = 1; y <= USEFUL_LIFE_YEARS; y++) {
    const expense = y === USEFUL_LIFE_YEARS ? depreciable - accumulated : annual;
    accumulated += expense;
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + y);
    rows.push({
      year: y,
      periodEnd: end.toISOString().slice(0, 10),
      expense: round2(expense),
      accumulated: round2(accumulated),
      bookValue: round2(purchasePrice - accumulated),
    });
  }

  const msPerYear = 365.25 * 24 * 3600 * 1000;
  const elapsed = Math.min(Math.max((today.getTime() - start.getTime()) / msPerYear, 0), USEFUL_LIFE_YEARS);
  const currentAccumulated = round2(annual * elapsed);

  return {
    cost: purchasePrice,
    annual: round2(annual),
    monthly: round2(annual / 12),
    rows,
    currentAccumulated,
    currentBookValue: round2(purchasePrice - currentAccumulated),
    elapsedYears: Math.round(elapsed * 10) / 10,
  };
}
