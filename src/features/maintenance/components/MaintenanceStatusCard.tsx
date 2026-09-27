import { CalendarClock, Gauge, Wrench } from "lucide-react";
import { StatusBadge } from "@/components/common/states";
import { formatDate, formatKm } from "@/lib/format";
import { STATUS_LABEL, STATUS_TONE } from "../engine/constants";
import { describeRemaining } from "../engine/engine";
import type { MaintenanceRow } from "../lib/view-model";

export function MaintenanceStatusCard({
  row,
  onLogService,
  onEditSchedule,
  compact = false,
}: {
  row: MaintenanceRow;
  onLogService?: (row: MaintenanceRow) => void;
  onEditSchedule?: (row: MaintenanceRow) => void;
  compact?: boolean;
}) {
  const { item, evaluation: e, schedule, vehicle } = row;
  const remaining = describeRemaining(e);

  return (
    <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name_ar}</p>
          {!compact ? <p className="mt-1 truncate text-xs text-ink-soft">{vehicle.name}</p> : null}
        </div>
        <StatusBadge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</StatusBadge>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-ink-soft sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <Gauge className="size-4 shrink-0" />
          {e.next_due_odometer != null ? `التالي عند ${formatKm(e.next_due_odometer)}` : "لا يوجد حد كيلومترات"}
        </p>
        <p className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0" />
          {e.next_due_date ? `التالي في ${formatDate(e.next_due_date)}` : "لا يوجد موعد زمني"}
        </p>
      </div>

      {remaining.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {remaining.map((x) => (
            <span key={x} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-ink-soft">{x}</span>
          ))}
        </div>
      ) : null}

      {!compact && schedule?.last_service_date ? (
        <p className="mt-3 text-xs text-ink-soft">
          آخر صيانة: {formatDate(schedule.last_service_date)}
          {schedule.last_service_odometer != null ? ` · ${formatKm(schedule.last_service_odometer)}` : ""}
        </p>
      ) : null}

      {(onLogService || onEditSchedule) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onLogService ? (
            <button
              type="button"
              onClick={() => onLogService(row)}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-accent-foreground"
            >
              <Wrench className="size-3.5" /> تسجيل صيانة
            </button>
          ) : null}
          {onEditSchedule ? (
            <button
              type="button"
              onClick={() => onEditSchedule(row)}
              className="rounded-xl bg-secondary px-3 py-2 text-xs font-medium"
            >
              تعديل الجدول
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
