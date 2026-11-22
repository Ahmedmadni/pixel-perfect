import type { TechnicalPart } from "../lib/technical-code-parts";
import { partsForCause } from "../lib/technical-code-parts";
import { getTechnicalCodeKnowledge } from "../lib/technical-code-knowledge";

export function TechnicalCodeDetails({ code, vehicleId, parts }: { code: string; vehicleId: string; parts: TechnicalPart[] }) {
  const knowledge = getTechnicalCodeKnowledge(code);
  if (!knowledge) return <p className="text-xs text-ink-soft">لا توجد أسباب فنية موثقة لهذا الكود في المرجع المحلي؛ يلزم الرجوع لدليل المصنع.</p>;
  return <details className="min-w-64 text-xs print:open">
    <summary className="cursor-pointer font-medium text-brand-deep">أسباب محتملة وفحوص التحقق ({knowledge.causes.length})</summary>
    <p className="mt-2 leading-6">{knowledge.meaning}</p>
    <ol className="mt-2 space-y-3">{knowledge.causes.map(cause => {
      const candidates = partsForCause(vehicleId, cause, parts);
      return <li key={cause.cause} className="border-s-2 border-border ps-3">
        <strong>{cause.cause}</strong><p className="mt-1 leading-6 text-ink-soft">{cause.check}</p>
        {candidates.length > 0 && <p className="mt-1 text-brand-deep">قطع مرشحة للفحص من سجلك: {candidates.map(p => p.name + (p.partNumber ? ` (${p.partNumber})` : "")).join("، ")}</p>}
        {cause.partKinds.length > 0 && candidates.length === 0 && <p className="mt-1 text-ink-soft">لا توجد قطعة مطابقة مسجلة لهذه السيارة.</p>}
      </li>;
    })}</ol>
    <p className="mt-3 text-accent">{knowledge.caution}</p>
    <p className="mt-2 text-ink-soft">{knowledge.scope}</p>
    <a className="mt-2 inline-block text-brand-deep underline" href={knowledge.source.url} target="_blank" rel="noopener noreferrer">{knowledge.source.title}</a>
  </details>;
}