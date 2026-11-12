import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useObdCodeSearch } from "../hooks/useObdCodes";
import {
  categoryLabel, countStandardCodes, CUSTOM_CODE_PATTERN, deleteUserObdCode, listUserObdCodes,
  normalizeObdCode, OBD_CATEGORY_LABELS, saveUserObdCode, type UserObdCode,
} from "../services/obd-codes.service";

const input = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const empty = { code: "", description: "", category: "P", notes: "" };

export function ObdCodesWorkspace() {
  const qc = useQueryClient();
  const own = useQuery({ queryKey: ["obd-codes", "own"], queryFn: listUserObdCodes });
  const total = useQuery({ queryKey: ["obd-codes", "count"], queryFn: countStandardCodes, staleTime: 3600_000 });
  const [term, setTerm] = useState("");
  const search = useObdCodeSearch(term);
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [customCat, setCustomCat] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["obd-codes"] });
  const save = useMutation({
    mutationFn: () => saveUserObdCode({ ...form, id: form.id }),
    onSuccess: () => { toast.success("تم حفظ الكود"); setForm(empty); setCustomCat(false); refresh(); },
    onError: (e: Error) => toast.error(e.message.includes("duplicate") ? "هذا الكود موجود في أكوادك" : "تعذّر حفظ الكود"),
  });
  const remove = useMutation({ mutationFn: deleteUserObdCode, onSuccess: () => { toast.success("تم الحذف"); refresh(); } });

  const code = normalizeObdCode(form.code);
  const valid = CUSTOM_CODE_PATTERN.test(code) && form.description.trim().length > 1 && form.category.trim().length > 0;

  function edit(r: UserObdCode) {
    setForm({ id: r.id, code: r.code, description: r.description, category: r.category, notes: r.notes ?? "" });
    setCustomCat(!(r.category in OBD_CATEGORY_LABELS));
  }
  function startFrom(code: string, description: string, category: string) {
    setForm({ code, description, category, notes: "" });
    setCustomCat(!(category in OBD_CATEGORY_LABELS));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">المكتبة القياسية</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {total.data != null ? `${total.data.toLocaleString("ar")} كود محفوظ مسبقاً` : "…"} — لا حاجة لسحبها مرة أخرى. ابحث وعدّل أي وصف ليصبح خاصاً بك.
          </p>
          <div className="relative mt-3">
            <Search className="absolute right-3 top-3.5 size-4 text-ink-soft" />
            <input className={input + " pr-9"} value={term} onChange={e => setTerm(e.target.value)} placeholder="ابحث بالكود أو الوصف، مثل P0171" />
          </div>
          {search.isFetching ? <Loader2 className="mt-3 size-4 animate-spin" /> : null}
          <ul className="mt-3 divide-y divide-border">
            {(search.data ?? []).map(r => (
              <li key={r.code} className="flex items-center gap-3 py-2 text-sm">
                <span dir="ltr" className="rounded-lg bg-brand/10 px-2 py-0.5 font-medium text-brand">{r.code}</span>
                <span className="min-w-0 flex-1">{r.description}<span className="block text-xs text-ink-soft">{categoryLabel(r.category)}{r.custom ? " · كودك" : ""}</span></span>
                <Button size="sm" variant="ghost" onClick={() => startFrom(r.code, r.description, r.category)}>تخصيص</Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">أكوادي ({own.data?.length ?? 0})</h2>
          {own.data?.length === 0 ? <p className="mt-2 text-sm text-ink-soft">لم تضف أكواداً خاصة بعد.</p> : null}
          <ul className="mt-3 divide-y divide-border">
            {(own.data ?? []).map(r => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span dir="ltr" className="rounded-lg bg-accent/15 px-2 py-0.5 font-medium">{r.code}</span>
                <span className="min-w-0 flex-1">{r.description}<span className="block text-xs text-ink-soft">{categoryLabel(r.category)}{r.notes ? ` · ${r.notes}` : ""}</span></span>
                <button aria-label={`تعديل ${r.code}`} onClick={() => edit(r)} className="text-ink-soft hover:text-brand"><Pencil className="size-4" /></button>
                <button aria-label={`حذف ${r.code}`} onClick={() => remove.mutate(r.id)} className="text-ink-soft hover:text-danger"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <form className="h-fit space-y-3 rounded-2xl border border-border bg-surface p-5" onSubmit={e => { e.preventDefault(); if (valid) save.mutate(); }}>
        <h2 className="font-semibold">{form.id ? "تعديل كود" : "إضافة كود"}</h2>
        <label className="block text-sm">الكود
          <input dir="ltr" className={input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="P0171" />
        </label>
        <label className="block text-sm">الوصف
          <textarea className={input} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="block text-sm">الفئة
          <select className={input} value={customCat ? "__new" : form.category} onChange={e => {
            if (e.target.value === "__new") { setCustomCat(true); setForm({ ...form, category: "" }); }
            else { setCustomCat(false); setForm({ ...form, category: e.target.value }); }
          }}>
            {Object.entries(OBD_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
            <option value="__new">فئة جديدة…</option>
          </select>
        </label>
        {customCat ? <input className={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="اسم الفئة الجديدة" aria-label="اسم الفئة الجديدة" /> : null}
        <label className="block text-sm">ملاحظات
          <input className={input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={!valid || save.isPending}><Plus className="size-4" /> حفظ</Button>
          {form.id || form.code ? <Button type="button" variant="ghost" onClick={() => { setForm(empty); setCustomCat(false); }}>إلغاء</Button> : null}
        </div>
      </form>
    </div>
  );
}
