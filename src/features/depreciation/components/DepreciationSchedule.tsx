import { Calculator, Info } from "lucide-react";
import { EmptyState } from "@/components/common/states";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";
import {
  calculateDepreciation,
  DEFAULT_SALVAGE_VALUE,
  DEFAULT_USEFUL_LIFE_YEARS,
  formatElapsed,
} from "../lib/depreciation";

export function DepreciationSchedule({ vehicle }: { vehicle: Vehicle }) {
  const r = calculateDepreciation(vehicle.purchase_price, vehicle.purchase_date);

  if (r.status === "missing_data")
    return (
      <EmptyState
        icon={Calculator}
        title="أضف قيمة وتاريخ الشراء"
        description={`يبدأ الإهلاك من تاريخ الشراء بطريقة القسط الثابت على ${DEFAULT_USEFUL_LIFE_YEARS} سنة بقيمة تخريدية ${formatCurrency(DEFAULT_SALVAGE_VALUE)}.`}
      />
    );

  if (r.status === "not_depreciable")
    return (
      <EmptyState
        icon={Info}
        title="لا يوجد مبلغ قابل للإهلاك"
        description="قيمة الشراء أقل من أو تساوي القيمة التخريدية، لذلك لا يوجد مبلغ قابل للإهلاك وفق الافتراضات الحالية."
      />
    );

  const s = r.schedule;
  const currentYear = s.fullyDepreciated ? 0 : Math.min(s.elapsed.years + 1, s.usefulLife);
  const stats: [string, string][] = [
    ["قيمة الشراء", formatCurrency(s.cost)],
    ["القيمة الدفترية الحالية", formatCurrency(s.currentBookValue)],
    ["مجمع الإهلاك حتى اليوم", formatCurrency(s.currentAccumulated)],
    ["الإهلاك السنوي", formatCurrency(s.annual)],
    ["الإهلاك الشهري", formatCurrency(s.monthly)],
    ["العمر المنقضي منذ الشراء", s.fullyDepreciated ? "انتهى العمر الافتراضي" : `${formatElapsed(s.elapsed)} من ${s.usefulLife} سنة`],
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map(([k, v], i) => (
          <div key={k} className={i === 1 ? "rounded-xl bg-brand-deep p-4 text-primary-foreground" : "rounded-xl bg-panel p-4 ring-1 ring-border"}>
            <dt className="text-xs opacity-80">{k}</dt>
            <dd className="num mt-1 text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-soft">
        القسط الثابت · يبدأ من تاريخ الشراء ({formatDate(vehicle.purchase_date!)}) · العمر الافتراضي {s.usefulLife} سنة · القيمة التخريدية {formatCurrency(s.salvage)} · المبلغ القابل للإهلاك {formatCurrency(s.depreciable)}
      </p>
      <div className="overflow-x-auto rounded-2xl bg-panel ring-1 ring-border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-secondary/60 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3 text-start font-medium">السنة</th>
              <th className="px-4 py-3 text-start font-medium">نهاية الفترة</th>
              <th className="px-4 py-3 text-start font-medium">الإهلاك</th>
              <th className="px-4 py-3 text-start font-medium">المجمع</th>
              <th className="px-4 py-3 text-start font-medium">القيمة الدفترية</th>
            </tr>
          </thead>
          <tbody>
            {s.rows.map((row) => (
              <tr key={row.year} className={`border-t border-border ${row.year === currentYear ? "bg-brand/5 font-semibold" : ""}`}>
                <td className="num px-4 py-2.5">{row.year}</td>
                <td className="px-4 py-2.5">{formatDate(row.periodEnd)}</td>
                <td className="num px-4 py-2.5">{formatCurrency(row.expense)}</td>
                <td className="num px-4 py-2.5">{formatCurrency(row.accumulated)}</td>
                <td className="num px-4 py-2.5">{formatCurrency(row.bookValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
