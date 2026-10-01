import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { useSaveDiagnosticTest } from "../hooks/useDiagnostics";
import type {
  DiagnosticIssue,
  DiagnosticTest,
  DiagnosticTestInput,
  DiagnosticTestResult,
} from "../services/diagnostics.service";

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const today = () => new Date().toLocaleDateString("en-CA");
const resultLabels: Record<DiagnosticTestResult, string> = {
  pass: "طبيعي / ناجح",
  fail: "غير طبيعي / فشل",
  inconclusive: "غير حاسم",
};

export function DiagnosticTestForm({
  open,
  onOpenChange,
  issue,
  test,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: DiagnosticIssue | null;
  test?: DiagnosticTest | null;
}) {
  const save = useSaveDiagnosticTest();
  const [form, setForm] = useState<DiagnosticTestInput>({
    issue_id: "",
    sequence_no: 1,
    performed_date: today(),
    odometer: null,
    system_area: null,
    test_name: "",
    test_method: null,
    expected_result: null,
    actual_result: null,
    result_status: "inconclusive",
    conclusion: null,
  });

  useEffect(() => {
    if (!open || !issue) return;
    setForm({
      issue_id: issue.id,
      sequence_no: test?.sequence_no ?? issue.tests.length + 1,
      performed_date: test?.performed_date ?? today(),
      odometer: test?.odometer ?? issue.first_odometer,
      system_area: test?.system_area ?? null,
      test_name: test?.test_name ?? "",
      test_method: test?.test_method ?? null,
      expected_result: test?.expected_result ?? null,
      actual_result: test?.actual_result ?? null,
      result_status: test?.result_status ?? "inconclusive",
      conclusion: test?.conclusion ?? null,
    });
  }, [open, issue, test]);

  if (!issue) return null;
  const set = <K extends keyof DiagnosticTestInput>(key: K, value: DiagnosticTestInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-right">
          <DialogTitle>{test ? "تعديل خطوة فحص" : "إضافة خطوة فحص"}</DialogTitle>
          <DialogDescription>
            {issue.title} — سجّل ما تم فحصه وكيف تمت المقارنة بين المتوقع والنتيجة الفعلية.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              { input: form, id: test?.id },
              {
                onSuccess: () => {
                  toast.success(test ? "تم تحديث الفحص" : "تمت إضافة خطوة الفحص");
                  onOpenChange(false);
                },
                onError: (error) => toast.error(errorMessage(error)),
              },
            );
          }}
        >
          <Field label="ترتيب الخطوة">
            <input
              className={inputClass}
              type="number"
              min="1"
              value={form.sequence_no}
              onChange={(event) => set("sequence_no", Number(event.target.value))}
            />
          </Field>

          <Field label="تاريخ الفحص">
            <input
              className={inputClass}
              type="date"
              max={today()}
              value={form.performed_date}
              onChange={(event) => set("performed_date", event.target.value)}
            />
          </Field>

          <Field label="النظام / المنطقة">
            <input
              className={inputClass}
              placeholder="مثال: إشعال، وقود، تبريد، فرامل"
              value={form.system_area ?? ""}
              onChange={(event) => set("system_area", event.target.value || null)}
            />
          </Field>

          <Field label="العداد">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={form.odometer ?? ""}
              onChange={(event) => set("odometer", event.target.value ? Number(event.target.value) : null)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="اسم الفحص / الاختبار">
              <input
                className={inputClass}
                placeholder="مثال: قياس مقاومة كويل الأسطوانة الأولى"
                value={form.test_name}
                onChange={(event) => set("test_name", event.target.value)}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="طريقة الفحص">
              <textarea
                className={inputClass + " min-h-20"}
                placeholder="الأداة والخطوات أو طريقة القياس"
                value={form.test_method ?? ""}
                onChange={(event) => set("test_method", event.target.value || null)}
              />
            </Field>
          </div>

          <Field label="النتيجة المتوقعة">
            <textarea
              className={inputClass + " min-h-20"}
              value={form.expected_result ?? ""}
              onChange={(event) => set("expected_result", event.target.value || null)}
            />
          </Field>

          <Field label="النتيجة الفعلية">
            <textarea
              className={inputClass + " min-h-20"}
              value={form.actual_result ?? ""}
              onChange={(event) => set("actual_result", event.target.value || null)}
            />
          </Field>

          <Field label="حكم الاختبار">
            <select
              className={inputClass}
              value={form.result_status}
              onChange={(event) => set("result_status", event.target.value as DiagnosticTestResult)}
            >
              {(Object.keys(resultLabels) as DiagnosticTestResult[]).map((result) => (
                <option key={result} value={result}>
                  {resultLabels[result]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الاستنتاج من هذه الخطوة">
            <textarea
              className={inputClass + " min-h-20"}
              value={form.conclusion ?? ""}
              onChange={(event) => set("conclusion", event.target.value || null)}
            />
          </Field>

          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className={secondaryBtn} onClick={() => onOpenChange(false)}>
              إلغاء
            </button>
            <button className={primaryBtn} disabled={save.isPending || !form.test_name.trim() || !form.actual_result?.trim()}>
              <Save className="size-4" />
              {save.isPending ? "جارٍ الحفظ..." : "حفظ الفحص"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
