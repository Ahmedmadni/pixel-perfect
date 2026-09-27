import { Link } from "@tanstack/react-router";
import { ArrowLeft, Receipt, Wrench } from "lucide-react";
import { QueryErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useExpenses } from "../hooks/useExpenses";
import { summarizeExpenses } from "../lib/summary";

export function MonthlyExpenseCard() {
  const expensesQ = useExpenses();

  if (expensesQ.isPending) {
    return <Skeleton className="h-44 w-full rounded-2xl" />;
  }

  if (expensesQ.error) {
    return <QueryErrorState error={expensesQ.error} onRetry={() => expensesQ.refetch()} />;
  }

  const summary = summarizeExpenses(expensesQ.data ?? []);

  return (
    <section className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="size-4 text-brand-deep" /> المصروفات الشهرية
          </p>
          <p className="num mt-3 text-3xl font-semibold">{formatCurrency(summary.total)}</p>
          <p className="mt-1 text-xs text-ink-soft">{summary.count} عملية خلال الشهر الحالي</p>
        </div>
        <Link to="/expenses" className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep">
          التفاصيل <ArrowLeft className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-secondary p-3">
          <p className="flex items-center gap-1 text-ink-soft"><Wrench className="size-3.5" /> الصيانة</p>
          <p className="num mt-1 font-semibold">{formatCurrency(summary.maintenance)}</p>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-ink-soft">مصروفات أخرى</p>
          <p className="num mt-1 font-semibold">{formatCurrency(summary.manual)}</p>
        </div>
      </div>
    </section>
  );
}
