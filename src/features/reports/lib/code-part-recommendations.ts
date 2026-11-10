export interface LinkedPart { id: string; name: string; partNumber: string | null; vehicleIds: string[] }
export interface CodePartLink { code: string; part_id: string }

/** Parts linked to a code that fit the vehicle, keyed by code. */
export function partsByCode(vehicleId: string, links: CodePartLink[], parts: LinkedPart[]): Map<string, LinkedPart[]> {
  const byId = new Map(parts.map(p => [p.id, p]));
  const out = new Map<string, LinkedPart[]>();
  for (const l of links) {
    const p = byId.get(l.part_id);
    if (!p || !p.vehicleIds.includes(vehicleId)) continue;
    const list = out.get(l.code) ?? [];
    if (!list.some(x => x.id === p.id)) list.push(p);
    out.set(l.code, list);
  }
  return out;
}

/** Attach linked parts to each recommendation by its related codes; parts no recommendation covers are returned as leftovers. */
export function attachParts<R extends { related_codes?: string[] | undefined }>(recs: R[], map: Map<string, LinkedPart[]>, activeCodes: string[]) {
  const used = new Set<string>();
  const withParts = recs.map(r => {
    const list: LinkedPart[] = [];
    for (const code of r.related_codes ?? []) for (const p of map.get(code) ?? []) if (!list.some(x => x.id === p.id)) { list.push(p); used.add(p.id); }
    return { ...r, parts: list };
  });
  const leftovers: { code: string; part: LinkedPart }[] = [];
  for (const code of activeCodes) for (const p of map.get(code) ?? []) if (!used.has(p.id) && !leftovers.some(x => x.part.id === p.id)) leftovers.push({ code, part: p });
  return { recommendations: withParts, leftovers };
}
