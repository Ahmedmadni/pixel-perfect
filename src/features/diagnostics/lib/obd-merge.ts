export interface ObdRow { code: string; description: string; category: string }

/** Merge standard library rows with the user's own rows; user rows override the same code. */
export function mergeObdCodes(standard: ObdRow[], own: ObdRow[]): (ObdRow & { custom: boolean })[] {
  const map = new Map<string, ObdRow & { custom: boolean }>();
  for (const r of standard) map.set(r.code, { ...r, custom: false });
  for (const r of own) map.set(r.code, { ...r, custom: true });
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}
