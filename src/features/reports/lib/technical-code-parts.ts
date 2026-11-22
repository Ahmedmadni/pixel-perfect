import type { LinkedPart, CodePartLink } from "./code-part-recommendations";
import { partsByCode } from "./code-part-recommendations";
import { getTechnicalCodeKnowledge, matchesPartKind, type TechnicalCause } from "./technical-code-knowledge";

export interface TechnicalPart extends LinkedPart { nameEn?: string | null; status?: string }
export function partsForCause(vehicleId: string, cause: TechnicalCause, parts: TechnicalPart[]): TechnicalPart[] {
  return parts.filter(p => p.vehicleIds.includes(vehicleId) && p.status !== "archived" && cause.partKinds.some(kind => matchesPartKind(`${p.name} ${p.nameEn ?? ""}`, kind)));
}
/** Catalog name matches are suggestions, never silently persisted as confirmed links. */
export function technicalPartsByCode(vehicleId: string, codes: string[], links: CodePartLink[], parts: TechnicalPart[]) {
  const available = parts.filter(p => p.status !== "archived");
  const map = partsByCode(vehicleId, links, available);
  for (const code of codes) {
    const knowledge = getTechnicalCodeKnowledge(code);
    if (!knowledge) continue;
    const merged = new Map((map.get(code) ?? []).map(p => [p.id, p]));
    for (const cause of knowledge.causes) for (const p of partsForCause(vehicleId, cause, available)) merged.set(p.id, p);
    map.set(code, [...merged.values()]);
  }
  return map;
}