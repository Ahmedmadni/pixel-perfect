import { useMemo, useState } from "react";
import {
  ExternalLink,
  FileText,
  Gauge,
  Pencil,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { errorMessage } from "@/lib/data-provider";
import { formatCurrency, formatDate, formatKm } from "@/lib/format";
import { useDeleteExpense, useExpenseCategories, useExpenses } from "../hooks/useExpenses";
import { currentMonthKey, summarizeExpenses } from "../lib/summary";
import { getExpenseReceiptUrl, type Expense, type ExpenseSource } from "../services/expenses.service";
import { ExpenseForm } from "./ExpenseForm";

type SourceFilter = "all" | ExpenseSource;
type PeriodFilter = "month" | "all";

export function ExpenseWorkspace({ vehicleId }: { vehicleId?: string }) {
  const vehiclesQ = useVehicles();
  const categoriesQ = useExpenseCategories();
  const expensesQ = useExpenses(vehicleId);
  const removeExpense = useDeleteExpense();

  const [query, setQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId ?? "all");
  const [categoryId, setCategoryId] = useState("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const loading = vehiclesQ.isPending || categoriesQ.isPending || expensesQ.isPending;
  const error = vehiclesQ.error ?? categoriesQ.error ?? expensesQ.error;
  const month = currentMonthKey();
  const expenses = expensesQ.data ?? [];
  const summary = useMemo(() => summarizeExpenses(expenses, month), [expenses, month]);

  const vehicles = useMemo(
    () => (vehiclesQ.data ?? []).filter((vehicle) => !vehicleId || vehicle.id === vehicleId),
    [vehiclesQ.data, vehicleId],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (selectedVehicle !== "all" && expense.vehicle_id !== selectedVehicle) return false;
      if (categoryId !== "all" && expense.category_id !== categoryId) return false;
      if (source !== "all" && expense.source !== source) return false;
      if (period === "month" && expense.expense_date.slice(0, 7) !== month) return false;
      if (!needle) return true;
      return [
        expense.category?.name_ar ?? "",
        expense.vehicle?.name ?? "",
        expense.vendor_name ?? "",
        expense.description ?? "",
        expense.notes ?? "",
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [expenses, selectedVehicle, categoryId, source, period, month, query]);

  function openNewExpense() {
    setEditExpense(null);
    setFormOpen(true);
  }

  function openEditExpense(expense: Expense) {
    if (expense.source !== "manual") {
      toast.info("مصروف الصيانة يُعدّل من سجل الصيانة.");
      return;
    }
    setEditExpense(expense);
    setFormOpen(true);
  }

  async function openReceipt(expense: Expense) {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await getExpenseReceiptUrl(expense);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (err) {
      tab?.close();
      toast.error(errorMessage(err));
    }
  }

  if (loading) return <CardsSkeleton count={6} />;
  if (error) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => {
          vehiclesQ.refetch();
          categoriesQ.refetch();
          expensesQ.refetch();
        }}
        notConnectedDescription="تعذر تحميل بيانات المصروفات. تحقق من اتصال قاعدة البيانات."
      />
    );
  }

  if (!vehicles.length) {
    return <EmptyState title="لا توجد سيارة للمصروفات" description="أضف سيارة أولًا ثم ابدأ تسجيل التكاليف." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="مصروف الشهر" value={formatCurrency(summary.total)} icon={Receipt} />
        <SummaryCard label="صيانة هذا الشهر" value={formatCurrency(summary.maintenance)} icon={Wrench} />
        <SummaryCard label="مصروفات أخرى" value={formatCurrency(summary.manual)} icon={FileText} />
        <SummaryCard label="عدد العمليات" value={String(summary.count)} icon={SlidersHorizontal} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-panel p-4 ring-1 ring-border">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              className="w-full rounded-xl border border-border bg-background py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="ابحث بالنوع أو السيارة أو الجهة أو الوصف..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {!vehicleId ? (
            <select
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              value={selectedVehicle}
              onChange={(event) => setSelectedVehicle(event.target.value)}
            >
              <option value="all">كل السيارات</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
              ))}
            </select>
          ) : null}

          <select
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="all">كل الأنواع</option>
            {(categoriesQ.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name_ar}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            value={source}
            onChange={(event) => setSource(event.target.value as SourceFilter)}
          >
            <option value="all">كل المصادر</option>
            <option value="manual">مصروف يدوي</option>
            <option value="maintenance">من الصيانة</option>
          </select>

          <select
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            value={period}
            onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
          >
            <option value="month">الشهر الحالي</option>
            <option value="all">كل الفترات</option>
          </select>

          <button type="button" className={primaryBtn} onClick={openNewExpense}>
            <Plus className="size-4" /> إضافة مصروف
          </button>
        </div>

        <p className="text-xs text-ink-soft">
          مصروفات الصيانة التي تحتوي تكلفة تظهر هنا تلقائيًا، ولا تحتاج لإدخالها مرة أخرى.
        </p>
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((expense) => (
            <div key={expense.id} className="rounded-2xl bg-panel p-4 ring-1 ring-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{expense.category?.name_ar ?? "مصروف"}</p>
                    <StatusBadge tone={expense.source === "maintenance" ? "brand" : "neutral"}>
                      {expense.source === "maintenance" ? "من الصيانة" : "يدوي"}
                    </StatusBadge>
                    {!vehicleId && expense.vehicle?.name ? (
                      <StatusBadge>{expense.vehicle.name}</StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {formatDate(expense.expense_date)}
                    {expense.odometer != null ? " · " + formatKm(expense.odometer) : ""}
                  </p>
                </div>
                <p className="num text-lg font-semibold">{formatCurrency(expense.amount)}</p>
              </div>

              {(expense.description || expense.vendor_name || expense.notes) ? (
                <div className="mt-3 grid gap-1 text-xs text-ink-soft">
                  {expense.description ? <p className="text-sm font-medium text-foreground">{expense.description}</p> : null}
                  {expense.vendor_name ? <p>الجهة: {expense.vendor_name}</p> : null}
                  {expense.notes ? <p className="whitespace-pre-wrap">{expense.notes}</p> : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {expense.receipt_url ? (
                  <button type="button" className={secondaryBtn} onClick={() => openReceipt(expense)}>
                    <ExternalLink className="size-4" /> المرفق
                  </button>
                ) : null}

                {expense.source === "manual" ? (
                  <>
                    <button type="button" className={secondaryBtn} onClick={() => openEditExpense(expense)}>
                      <Pencil className="size-4" /> تعديل
                    </button>
                    <ConfirmDialog
                      title="حذف المصروف؟"
                      description="سيتم حذف المصروف ومرفقه إن وجد. لا يمكن التراجع."
                      confirmLabel="حذف"
                      onConfirm={() =>
                        removeExpense.mutate(expense, {
                          onSuccess: () => toast.success("تم حذف المصروف"),
                          onError: (err) => toast.error(errorMessage(err)),
                        })
                      }
                      trigger={
                        <button type="button" className={secondaryBtn + " text-destructive"}>
                          <Trash2 className="size-4" /> حذف
                        </button>
                      }
                    />
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs text-ink-soft">
                    <Wrench className="size-3.5" /> التعديل من سجل الصيانة
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="لا توجد مصروفات مطابقة"
          description="غيّر الفلاتر أو أضف أول مصروف لهذه الفترة."
          action={<button type="button" className={primaryBtn} onClick={openNewExpense}><Plus className="size-4" /> إضافة مصروف</button>}
        />
      )}

      <ExpenseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditExpense(null);
        }}
        vehicles={vehiclesQ.data ?? []}
        categories={categoriesQ.data ?? []}
        vehicleId={vehicleId ?? (selectedVehicle !== "all" ? selectedVehicle : undefined)}
        expense={editExpense}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Gauge;
}) {
  return (
    <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <p className="num mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
