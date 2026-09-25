import { Calculator } from "lucide-react";
import { EmptyState } from "@/components/common/states";
import { formatDate } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";
import { buildDepreciationSchedule, SALVAGE_VALUE_SAR, USEFUL_LIFE_YEARS } from "../lib/depreciation";

const sar = (n: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ر.س`;

export function DepreciationSchedule({ vehicle }: { vehicle: Vehicle }) {
  const s =
    vehicle.purchase_price !== null && vehicle.purchase_date
      ? buildDepreciationSchedule(vehicle.purchase_price, vehicle.purchase_date)
      : null;

  if (!s)
    return (
      <EmptyState
        icon={Calculator}
        title="أضف قيمة وتاريخ الشراء"
        description={`يُحسب الإهلاك بالقسط الثابت على ${USEFUL_LIFE_YEARS} سنة بقيمة خردة ${sar(SALVAGE_VALUE_SAR)}. يجب أن تكون قيمة الشراء أكبر من قيمة الخردة.`}
      />
    );

  const currentYear = Math.min(Math.floor(s.elapsedYears) + 1, USEFUL_LIFE_YEARS);
  const stats: [string, string][] = [
    ["قيمة الشراء", sar(s.cost)],
    ["القيمة الدفترية الحالية", sar(s.currentBookValue)],
    ["مجمع الإهلاك حتى اليوم", sar(s.currentAccumulated)],
    ["الإهلاك السنوي", sar(s.annual)],
    ["الإهلاك الشهري", sar(s.monthly)],
    ["العمر المنقضي", `${s.elapsedYears} من ${USEFUL_LIFE_YEARS} سنة`],
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
        طريقة القسط الثابت · العمر الافتراضي {USEFUL_LIFE_YEARS} سنة · قيمة الخردة {sar(SALVAGE_VALUE_SAR)}
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
            {s.rows.map((r) => (
              <tr key={r.year} className={`border-t border-border ${r.year === currentYear ? "bg-brand/5 font-semibold" : ""}`}>
                <td className="num px-4 py-2.5">{r.year}</td>
                <td className="px-4 py-2.5">{formatDate(r.periodEnd)}</td>
                <td className="num px-4 py-2.5">{sar(r.expense)}</td>
                <td className="num px-4 py-2.5">{sar(r.accumulated)}</td>
                <td className="num px-4 py-2.5">{sar(r.bookValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
