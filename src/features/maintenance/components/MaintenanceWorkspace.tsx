import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, Wrench } from "lucide-react";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState } from "@/components/common/states";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import type { MaintenanceStatus } from "../engine/constants";
import { STATUS_LABEL } from "../engine/constants";
import { buildMaintenanceRows, type MaintenanceRow } from "../lib/view-model";
import {
  useMaintenanceItems,
  useMaintenanceRecords,
  useMaintenanceSchedules,
} from "../hooks/useMaintenance";
import type { MaintenanceRecord } from "../services/maintenance.service";
import { MaintenanceStatusCard } from "./MaintenanceStatusCard";
import { MaintenanceRecordForm } from "./MaintenanceRecordForm";
import { MaintenanceScheduleEditor } from "./MaintenanceScheduleEditor";
import { CustomMaintenanceItemForm } from "./CustomMaintenanceItemForm";
import { MaintenanceHistory } from "./MaintenanceHistory";

const statuses: ("all" | MaintenanceStatus)[] = ["all", "OVERDUE", "DUE", "DUE_SOON", "NO_HISTORY", "OK", "DISABLED"];

export function MaintenanceWorkspace({ vehicleId }: { vehicleId?: string }) {
  const vehiclesQ = useVehicles();
  const itemsQ = useMaintenanceItems();
  const schedulesQ = useMaintenanceSchedules(vehicleId);
  const recordsQ = useMaintenanceRecords(vehicleId);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MaintenanceStatus>("all");
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleId ?? "all");
  const [recordOpen, setRecordOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MaintenanceRow | null>(null);
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null);
  const [scheduleRow, setScheduleRow] = useState<MaintenanceRow | null>(null);

  const loading = vehiclesQ.isPending || itemsQ.isPending || schedulesQ.isPending || recordsQ.isPending;
  const error = vehiclesQ.error ?? itemsQ.error ?? schedulesQ.error ?? recordsQ.error;

  const vehicles = useMemo(
    () => (vehiclesQ.data ?? []).filter((vehicle) => !vehicleId || vehicle.id === vehicleId),
    [vehiclesQ.data, vehicleId],
  );

  const rows = useMemo(() => {
    const base = buildMaintenanceRows(vehicles, itemsQ.data ?? [], schedulesQ.data ?? []);
    const needle = query.trim().toLowerCase();
    return base.filter((row) => {
      if (selectedVehicle !== "all" && row.vehicle.id !== selectedVehicle) return false;
      if (status !== "all" && row.evaluation.status !== status) return false;
      if (!needle) return true;
      return [row.item.name_ar, row.vehicle.name, row.item.category?.name_ar ?? ""]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [vehicles, itemsQ.data, schedulesQ.data, selectedVehicle, status, query]);

  const records = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (recordsQ.data ?? []).filter((record) => {
      if (selectedVehicle !== "all" && record.vehicle_id !== selectedVehicle) return false;
      if (!needle) return true;
      return [record.item?.name_ar ?? "", record.vehicle?.name ?? "", record.workshop_name ?? "", record.notes ?? ""]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [recordsQ.data, selectedVehicle, query]);

  const openNewRecord = (row?: MaintenanceRow) => {
    setEditRecord(null);
    setSelectedRow(row ?? null);
    setRecordOpen(true);
  };

  const openEditRecord = (record: MaintenanceRecord) => {
    setSelectedRow(null);
    setEditRecord(record);
    setRecordOpen(true);
  };

  if (loading) return <CardsSkeleton count={6} />;
  if (error) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => {
          vehiclesQ.refetch();
          itemsQ.refetch();
          schedulesQ.refetch();
          recordsQ.refetch();
        }}
        notConnectedDescription="تعذر تحميل بيانات الصيانة. تحقق من اتصال قاعدة البيانات."
      />
    );
  }

  if (!vehicles.length) {
    return <EmptyState title="لا توجد سيارة للصيانة" description="أضف سيارة أولًا ثم ارجع إلى سجل الصيانة." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-panel p-4 ring-1 ring-border lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              className="w-full rounded-xl border border-border bg-background py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="ابحث باسم الصيانة أو السيارة أو الورشة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          {!vehicleId ? (
            <select
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="all">كل السيارات</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
            </select>
          ) : null}

          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <select
              className="rounded-xl border border-border bg-background py-2.5 pr-9 pl-8 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as "all" | MaintenanceStatus)}
            >
              {statuses.map((value) => (
                <option key={value} value={value}>{value === "all" ? "كل الحالات" : STATUS_LABEL[value]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={secondaryBtn} type="button" onClick={() => setCustomOpen(true)}>
            <Plus className="size-4" /> نوع صيانة خاص
          </button>
          <button className={primaryBtn} type="button" onClick={() => openNewRecord()}>
            <Wrench className="size-4" /> تسجيل صيانة
          </button>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">جدول الصيانة</h2>
            <p className="mt-1 text-xs text-ink-soft">الاستحقاق يحسب بالكيلومترات أو التاريخ، أيهما يأتي أولًا.</p>
          </div>
          <span className="text-xs text-ink-soft">{rows.length} بند</span>
        </div>
        {rows.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <MaintenanceStatusCard
                key={`${row.vehicle.id}:${row.item.id}`}
                row={row}
                onLogService={openNewRecord}
                onEditSchedule={(target) => setScheduleRow(target)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="لا توجد نتائج مطابقة" description="غيّر البحث أو فلتر الحالة لعرض بنود أخرى." />
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold">سجل أعمال الصيانة</h2>
          <p className="mt-1 text-xs text-ink-soft">كل عملية مسجلة بالتاريخ والعداد والتكلفة والفاتورة.</p>
        </div>
        <MaintenanceHistory records={records} onEdit={openEditRecord} showVehicle={!vehicleId} />
      </section>

      <MaintenanceRecordForm
        open={recordOpen}
        onOpenChange={setRecordOpen}
        vehicles={vehiclesQ.data ?? []}
        items={itemsQ.data ?? []}
        vehicleId={selectedRow?.vehicle.id ?? vehicleId ?? (selectedVehicle !== "all" ? selectedVehicle : undefined)}
        itemId={selectedRow?.item.id}
        record={editRecord}
      />
      <MaintenanceScheduleEditor
        row={scheduleRow}
        open={!!scheduleRow}
        onOpenChange={(open) => { if (!open) setScheduleRow(null); }}
      />
      <CustomMaintenanceItemForm open={customOpen} onOpenChange={setCustomOpen} />
    </div>
  );
}
