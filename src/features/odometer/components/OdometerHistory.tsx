import { Gauge } from "lucide-react";
import { EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatKm, formatNumber } from "@/lib/format";
import { useOdometerReadings } from "../hooks/useOdometer";
import { withDeltas } from "../lib/odometer-rules";

const sourceLabel: Record<string, string> = { manual: "يدوي", initial: "عند الإضافة" };

export function OdometerHistory({ vehicleId }: { vehicleId: string }) {
  const q = useOdometerReadings(vehicleId);

  if (q.isPending)
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  if (q.isError)
    return (
      <QueryErrorState
        error={q.error}
        onRetry={() => q.refetch()}
        notConnectedDescription="سيظهر سجل قراءات العداد هنا بعد تفعيل الاتصال."
      />
    );
  if (q.data.length === 0)
    return <EmptyState icon={Gauge} title="لا توجد قراءات عداد" description="سجّل أول قراءة لتبدأ المتابعة." />;

  const rows = withDeltas(q.data);

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-panel ring-1 ring-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              <th className="px-4 py-3 text-start font-medium">القراءة</th>
              <th className="px-4 py-3 text-start font-medium">الفرق</th>
              <th className="px-4 py-3 text-start font-medium">المصدر</th>
              <th className="px-4 py-3 text-start font-medium">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{formatDate(r.reading_date)}</td>
                <td className="num px-4 py-3 font-semibold">{formatKm(r.reading)}</td>
                <td className="num px-4 py-3 text-ink-soft">{r.delta === null ? "—" : `${r.delta >= 0 ? "+" : ""}${formatNumber(r.delta)}`}</td>
                <td className="px-4 py-3"><StatusBadge tone="brand">{sourceLabel[r.source] ?? r.source}</StatusBadge></td>
                <td className="px-4 py-3 text-ink-soft">{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="relative space-y-3 border-s-2 border-brand/20 ps-4 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="relative rounded-xl bg-panel p-4 ring-1 ring-border">
            <span className="absolute -start-[1.4rem] top-5 size-2.5 rounded-full bg-brand" />
            <div className="flex items-center justify-between">
              <p className="num text-lg font-semibold">{formatKm(r.reading)}</p>
              <StatusBadge tone="brand">{sourceLabel[r.source] ?? r.source}</StatusBadge>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {formatDate(r.reading_date)}
              {r.delta !== null ? ` · ${r.delta >= 0 ? "+" : ""}${formatNumber(r.delta)} كم` : ""}
            </p>
            {r.notes ? <p className="mt-2 text-sm text-ink-soft">{r.notes}</p> : null}
          </li>
        ))}
      </ol>
    </>
  );
}
