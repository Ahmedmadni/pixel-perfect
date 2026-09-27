import { Link } from "@tanstack/react-router";
import { ArrowLeft, Wrench } from "lucide-react";
import { QueryErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/types/vehicle";
import { buildVehicleMaintenanceRows } from "../lib/view-model";
import { useMaintenanceItems, useMaintenanceSchedules } from "../hooks/useMaintenance";
import { MaintenanceStatusCard } from "./MaintenanceStatusCard";

export function UpcomingMaintenanceCard({ vehicle }: { vehicle: Vehicle }) {
  const itemsQ = useMaintenanceItems();
  const schedulesQ = useMaintenanceSchedules(vehicle.id);

  if (itemsQ.isPending || schedulesQ.isPending) {
    return <Skeleton className="h-44 w-full rounded-2xl" />;
  }

  const error = itemsQ.error ?? schedulesQ.error;
  if (error) {
    return <QueryErrorState error={error} onRetry={() => { itemsQ.refetch(); schedulesQ.refetch(); }} />;
  }

  const rows = buildVehicleMaintenanceRows(vehicle, itemsQ.data ?? [], schedulesQ.data ?? [])
    .filter((row) => row.evaluation.status !== "DISABLED")
    .slice(0, 3);

  return (
    <section className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><Wrench className="size-4 text-brand-deep" /> الصيانة القادمة</p>
          <p className="mt-1 text-xs text-ink-soft">أهم البنود حسب الاستحقاق</p>
        </div>
        <Link to="/maintenance" className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep">
          عرض الكل <ArrowLeft className="size-3.5" />
        </Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {rows.map((row) => <MaintenanceStatusCard key={row.item.id} row={row} compact />)}
      </div>
    </section>
  );
}
