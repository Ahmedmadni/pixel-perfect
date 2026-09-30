import { useMemo, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useObdCodeLookup, useObdCodeSearch } from "../hooks/useObdCodes";
import { normalizeObdCode, OBD_CATEGORY_LABELS, OBD_CODE_PATTERN, type ObdCategory } from "../services/obd-codes.service";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

function categoryOf(code: string): ObdCategory | null {
  const c = code[0];
  return c === "P" || c === "B" || c === "C" || c === "U" ? c : null;
}

export function ObdCodePicker({ codes, onChange }: { codes: string[]; onChange: (next: string[]) => void }) {
  const [term, setTerm] = useState("");
  const search = useObdCodeSearch(term);
  const lookup = useObdCodeLookup(codes);

  const descriptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of lookup.data ?? []) map.set(row.code, row.description);
    return map;
  }, [lookup.data]);

  const add = (raw: string) => {
    const code = normalizeObdCode(raw);
    if (!code || codes.includes(code)) return;
    onChange([...codes, code]);
    setTerm("");
  };
  const remove = (code: string) => onChange(codes.filter((c) => c !== code));

  const typed = normalizeObdCode(term);
  const canAddTyped = OBD_CODE_PATTERN.test(typed) && !codes.includes(typed);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        أكواد الأعطال (OBD)
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            className={inputClass + " pr-9"}
            placeholder="ابحث بالكود مثل P0171 أو بوصف العطل"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (canAddTyped) add(typed);
              }
            }}
          />
        </div>
      </label>

      {canAddTyped ? (
        <button
          type="button"
          onClick={() => add(typed)}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-brand/50 px-3 py-2 text-sm text-brand"
        >
          <Plus className="size-4" /> إضافة الكود <span dir="ltr" className="font-medium">{typed}</span> يدويًا
        </button>
      ) : null}

      {term.trim().length >= 2 ? (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-border">
          {search.isLoading ? (
            <p className="flex items-center gap-2 p-3 text-sm text-ink-soft">
              <Loader2 className="size-4 animate-spin" /> جارٍ البحث...
            </p>
          ) : (search.data ?? []).length === 0 ? (
            <p className="p-3 text-sm text-ink-soft">لا توجد نتائج مطابقة في مكتبة الأكواد.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(search.data ?? []).map((row) => (
                <li key={row.code}>
                  <button
                    type="button"
                    onClick={() => add(row.code)}
                    className="flex w-full items-start gap-3 p-3 text-right text-sm hover:bg-brand/5"
                  >
                    <span dir="ltr" className="shrink-0 rounded-lg bg-brand/10 px-2 py-0.5 font-medium text-brand">
                      {row.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block">{row.description}</span>
                      <span className="block text-xs text-ink-soft">{OBD_CATEGORY_LABELS[row.category]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {codes.length > 0 ? (
        <ul className="space-y-2">
          {codes.map((code) => {
            const cat = categoryOf(code);
            return (
              <li key={code} className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3 text-sm">
                <span dir="ltr" className="shrink-0 rounded-lg bg-brand/10 px-2 py-0.5 font-medium text-brand">
                  {code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block">
                    {descriptions.get(code) ?? (lookup.isLoading ? "جارٍ جلب الوصف..." : "كود غير موجود في مكتبة الأكواد المعروفة.")}
                  </span>
                  {cat ? <span className="block text-xs text-ink-soft">{OBD_CATEGORY_LABELS[cat]}</span> : null}
                </span>
                <button type="button" onClick={() => remove(code)} aria-label={`حذف ${code}`} className="text-ink-soft hover:text-danger">
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-ink-soft">أضف كود العطل الظاهر في جهاز الفحص، وسيعرض التطبيق وصفه تلقائيًا.</p>
      )}
    </div>
  );
}
