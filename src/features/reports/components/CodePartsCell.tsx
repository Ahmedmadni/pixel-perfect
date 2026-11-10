import { X } from "lucide-react";
import type { Part } from "@/features/parts/services/parts.service";
import type { ObdCodePartLink } from "@/features/parts/services/obd-code-parts.service";
import { errorMessage } from "@/lib/data-provider";
import { useLinkPartToCode, useUnlinkPart } from "../hooks/useObdCodePartLinks";

export function CodePartsCell({ code, links, parts }: { code: string; links: ObdCodePartLink[]; parts: Part[] }) {
  const link = useLinkPartToCode();
  const unlink = useUnlinkPart();
  const linked = links.map(l => ({ l, p: parts.find(p => p.id === l.part_id) })).filter(x => x.p);
  const available = parts.filter(p => !links.some(l => l.part_id === p.id));
  const err = link.error ?? unlink.error;
  return <div className="min-w-40 space-y-1">
    {linked.map(({ l, p }) => <span key={l.id} className="me-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
      {p!.name_ar}
      <button type="button" className="print:hidden" aria-label={`إزالة ${p!.name_ar} من ${code}`} onClick={() => unlink.mutate(l.id)}><X className="size-3" /></button>
    </span>)}
    {parts.length === 0 ? <p className="text-xs text-ink-soft">لا توجد قطع لهذه السيارة</p> :
      available.length > 0 && <select aria-label={`ربط قطعة بالكود ${code}`} className="w-full rounded-md border border-input bg-background p-1 text-xs print:hidden" value="" disabled={link.isPending}
        onChange={e => e.target.value && link.mutate({ code, partId: e.target.value })}>
        <option value="">+ ربط قطعة</option>
        {available.map(p => <option key={p.id} value={p.id}>{p.name_ar}{p.part_number ? ` (${p.part_number})` : ""}</option>)}
      </select>}
    {err && <p role="alert" className="text-xs text-destructive">{errorMessage(err)}</p>}
  </div>;
}
