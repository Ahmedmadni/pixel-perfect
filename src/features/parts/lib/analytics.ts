import type { Part, PartPrice, PartStatus } from "../services/parts.service";

export interface PartSummary {
  total: number;
  researching: number;
  purchased: number;
  installed: number;
}

export function latestPartPrice(prices: PartPrice[]): PartPrice | null {
  if (!prices.length) return null;
  return [...prices].sort((a, b) => {
    const dateCompare = b.observed_date.localeCompare(a.observed_date);
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  })[0] ?? null;
}

export function summarizeParts(parts: Pick<Part, "status">[]): PartSummary {
  return {
    total: parts.length,
    researching: parts.filter((part) => part.status === "researching" || part.status === "found").length,
    purchased: parts.filter((part) => part.status === "purchased").length,
    installed: parts.filter((part) => part.status === "installed").length,
  };
}

export const PART_STATUS_LABELS: Record<PartStatus, string> = {
  researching: "أبحث عنها",
  found: "تم العثور",
  purchased: "تم الشراء",
  installed: "تم التركيب",
  archived: "مؤرشفة",
};
