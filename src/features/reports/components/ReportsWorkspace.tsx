import { useMemo, useState } from "react";
import { Download, Printer, ReceiptText, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState } from "@/components/common/states";
import { useExpenses } from "@/features/expenses/hooks/useExpenses";
import { currentBookValue } from "@/features/depreciation/lib/depreciation";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { DiagnosticReportsPanel } from "./DiagnosticReportsPanel";
import { formatCurrency, formatKm } from "@/lib/format";
import {
  categoryExpenseSeries,
  costPer1000Km,
  expensesToCsv,
  filterReportExpenses,
  monthlyExpenseSeries,
  summarizeReport,
  vehicleExpenseSeries,
  type ReportPeriod,
} from "../lib/analytics";

const periodLabels: Record<ReportPeriod, string> = {
  "3m": "آخر 3 أشهر",
  "6m": "آخر 6 أشهر",
  "12m": "آخر 12 شهرًا",
  all: "كل الفترات",
};

export function ReportsWorkspace() {
  const vehiclesQ = useVehicles();
  const expensesQ = useExpenses();

  const [vehicleId, setVehicleId] = useState<string | "all">("all");
  const [period, setPeriod] = useState<ReportPeriod>("12m");

  const loading = vehiclesQ.isPending || expensesQ.isPending;
  const error = vehiclesQ.error ?? expensesQ.error;

  const allExpenses = expensesQ.data ?? [];
  const filtered = useMemo(
    () => filterReportExpenses(allExpenses, period, vehicleId),
    [allExpenses, period, vehicleId],
  );
  const summary = useMemo(() => summarizeReport(filtered), [filtered]);
  const monthly = useMemo(() => monthlyExpenseSeries(filtered, period), [filtered, period]);
  const categories = useMemo(() => categoryExpenseSeries(filtered), [filtered]);
  const vehicleSeries = useMemo(() => vehicleExpenseSeries(filtered), [filtered]);

  const selectedVehicle =
    vehicleId === "all" ? null : (vehiclesQ.data ?? []).find((vehicle) => vehicle.id === vehicleId) ?? null;
  const lifetimeCostPer1000 =
    selectedVehicle ? costPer1000Km(selectedVehicle, allExpenses) : null;
  const selectedLifetimeExpense =
    selectedVehicle
      ? allExpenses
          .filter((expense) => expense.vehicle_id === selectedVehicle.id)
          .reduce((sum, expense) => sum + expense.amount, 0)
      : null;
  const selectedBookValue = selectedVehicle
    ? currentBookValue(selectedVehicle.purchase_price, selectedVehicle.purchase_date)
    : null;
  const selectedDistance =
    selectedVehicle?.purchase_odometer != null
      ? Math.max(0, selectedVehicle.current_odometer - selectedVehicle.purchase_odometer)
      : null;

  function exportCsv() {
    const csv = "\uFEFF" + expensesToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "car-expenses-report-" + new Date().toLocaleDateString("en-CA") + ".csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <CardsSkeleton count={6} />;
  if (error) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => {
          vehiclesQ.refetch();
          expensesQ.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 print:bg-white">
      <DiagnosticReportsPanel vehicles={vehiclesQ.data ?? []} />

      <div className="border-t border-border pt-2">
        <div className="mb-3">
          <p className="text-xs font-medium text-brand-deep">تقارير التشغيل والتكلفة</p>
          <h2 className="mt-1 text-lg font-semibold">التحليل المالي والتشغيلي</h2>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-panel p-4 ring-1 ring-border print:hidden lg:flex-row lg:items-center">
        <select
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
        >
          <option value="all">كل السيارات</option>
          {(vehiclesQ.data ?? []).map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          value={period}
          onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
        >
          {(Object.keys(periodLabels) as ReportPeriod[]).map((key) => (
            <option key={key} value={key}>
              {periodLabels[key]}
            </option>
          ))}
        </select>

        <div className="lg:mr-auto flex gap-2">
          <button className={secondaryBtn} onClick={() => window.print()}>
            <Printer className="size-4" /> طباعة
          </button>
          <button className={primaryBtn} onClick={exportCsv} disabled={!filtered.length}>
            <Download className="size-4" /> تصدير CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="إجمالي التشغيل" value={formatCurrency(summary.total)} />
        <Kpi label="الصيانة" value={formatCurrency(summary.maintenance)} />
        <Kpi label="قطع الغيار المستقلة" value={formatCurrency(summary.parts)} />
        <Kpi label="مصروفات أخرى" value={formatCurrency(summary.other)} />
      </div>

      <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-brand-deep" /> اتجاه المصروفات
            </h2>
            <p className="mt-1 text-xs text-ink-soft">{periodLabels[period]} · {summary.count} عملية</p>
          </div>
        </div>
        <div className="h-72 w-full text-brand-deep">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="amount" stroke="currentColor" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="التوزيع حسب النوع" empty={!categories.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="currentColor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="المقارنة بين السيارات" empty={!vehicleSeries.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleSeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="currentColor" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {selectedVehicle ? (
        <section className="rounded-2xl bg-panel p-5 ring-1 ring-border">
          <h2 className="text-sm font-semibold">مؤشرات منذ شراء {selectedVehicle.name}</h2>
          <p className="mt-1 text-xs text-ink-soft">
            هذه المؤشرات تستخدم كل المصروفات المسجلة للسيارة، وليست مرتبطة بفلتر الفترة أعلاه.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="مصروفات التشغيل المسجلة" value={formatCurrency(selectedLifetimeExpense)} />
            <Kpi
              label="المسافة منذ الشراء"
              value={selectedDistance != null ? formatKm(selectedDistance) : "غير متاحة"}
            />
            <Kpi
              label="تكلفة كل 1,000 كم"
              value={lifetimeCostPer1000 != null ? formatCurrency(lifetimeCostPer1000) : "غير متاحة"}
            />
            <Kpi label="القيمة الدفترية الحالية" value={formatCurrency(selectedBookValue)} />
          </div>

          <p className="mt-4 rounded-xl bg-secondary p-3 text-xs text-ink-soft">
            الإهلاك والقيمة الدفترية مؤشرات محاسبية وليسا مصروفًا نقديًا؛ لذلك لا يتم جمع الإهلاك مع مصروفات التشغيل.
          </p>
        </section>
      ) : null}

      {!filtered.length ? (
        <EmptyState
          icon={ReceiptText}
          title="لا توجد بيانات مصروفات لهذه الفترة"
          description="غيّر الفترة أو السيارة، أو ابدأ تسجيل المصروفات والصيانة لتظهر التحليلات."
        />
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="num mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-panel p-4 text-brand-deep ring-1 ring-border">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>
      {empty ? (
        <div className="grid h-64 place-items-center rounded-xl border border-dashed border-border text-sm text-ink-soft">
          لا توجد بيانات كافية
        </div>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </section>
  );
}
