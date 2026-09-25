import { Link } from "@tanstack/react-router";
import { Car, Gauge } from "lucide-react";
import { StatusBadge } from "@/components/common/states";
import { formatKm } from "@/lib/format";
import { vehicleTitle, type Vehicle } from "@/types/vehicle";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      to="/vehicles/$vehicleId"
      params={{ vehicleId: vehicle.id }}
      className="group block rounded-2xl bg-panel p-5 ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand-deep">
            <Car className="size-5" />
          </div>
          <div>
            <p className="font-semibold">{vehicle.name}</p>
            <p className="text-xs text-ink-soft" dir="auto">{vehicleTitle(vehicle)}</p>
          </div>
        </div>
        <StatusBadge tone={vehicle.is_active ? "success" : "neutral"}>
          {vehicle.is_active ? "نشطة" : "غير نشطة"}
        </StatusBadge>
      </div>
      <div className="mt-5 flex items-center gap-2 text-ink-soft">
        <Gauge className="size-4" />
        <span className="text-xs">العداد الحالي</span>
      </div>
      <p className="num mt-1 text-2xl font-semibold">{formatKm(vehicle.current_odometer)}</p>
    </Link>
  );
}
