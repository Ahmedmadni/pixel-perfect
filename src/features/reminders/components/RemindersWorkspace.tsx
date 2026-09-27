import { useMemo, useState } from "react";
import { Bell, Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { errorMessage } from "@/lib/data-provider";
import { formatDate, formatKm } from "@/lib/format";
import { useDeleteReminder, useReminders, useSetReminderStatus } from "../hooks/useReminders";
import {
  computeReminderStatus,
  sortReminders,
  summarizeReminders,
  type ReminderComputedStatus,
} from "../lib/engine";
import type { Reminder } from "../services/reminders.service";
import { ReminderForm } from "./ReminderForm";

const labels: Record<ReminderComputedStatus, string> = {
  ok: "لاحقًا",
  due_soon: "قريب",
  due: "مستحق",
  overdue: "متأخر",
  completed: "مكتمل",
  dismissed: "متجاهل",
};

const tones: Record<ReminderComputedStatus, "neutral" | "warning" | "danger" | "success" | "brand"> = {
  ok: "neutral",
  due_soon: "warning",
  due: "brand",
  overdue: "danger",
  completed: "success",
  dismissed: "neutral",
};

export function RemindersWorkspace() {
  const vehiclesQ = useVehicles();
  const remindersQ = useReminders();
  const setStatus = useSetReminderStatus();
  const remove = useDeleteReminder();

  const [query, setQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState<"all" | ReminderComputedStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Reminder | null>(null);

  const loading = vehiclesQ.isPending || remindersQ.isPending;
  const error = vehiclesQ.error ?? remindersQ.error;
  const reminders = sortReminders(remindersQ.data ?? []);
  const summary = useMemo(() => summarizeReminders(reminders), [reminders]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reminders.filter((reminder) => {
      const computed = computeReminderStatus(reminder, reminder.vehicle?.current_odometer ?? 0).status;
      if (vehicleFilter !== "all" && reminder.vehicle_id !== vehicleFilter) return false;
      if (stateFilter !== "all" && computed !== stateFilter) return false;
      if (!needle) return true;
      return [reminder.title, reminder.notes ?? "", reminder.vehicle?.name ?? ""].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [reminders, vehicleFilter, stateFilter, query]);

  if (loading) return <CardsSkeleton count={6} />;
  if (error) {
    return (
      <QueryErrorState
        error={error}
        onRetry={() => {
          vehiclesQ.refetch();
          remindersQ.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="نشطة" value={summary.active} />
        <Summary label="متأخرة" value={summary.overdue} />
        <Summary label="مستحقة" value={summary.due} />
        <Summary label="قريبة" value={summary.dueSoon} />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-panel p-4 ring-1 ring-border xl:flex-row">
        <label className="relative flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            className="w-full rounded-xl border border-border bg-background py-2.5 pr-9 pl-3 text-sm"
            placeholder="ابحث في التذكيرات..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <select
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          value={vehicleFilter}
          onChange={(event) => setVehicleFilter(event.target.value)}
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
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value as "all" | ReminderComputedStatus)}
        >
          <option value="all">كل الحالات</option>
          {(Object.keys(labels) as ReminderComputedStatus[]).map((status) => (
            <option key={status} value={status}>
              {labels[status]}
            </option>
          ))}
        </select>

        <button
          className={primaryBtn}
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> إضافة تذكير
        </button>
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((reminder) => {
            const computed = computeReminderStatus(reminder, reminder.vehicle?.current_odometer ?? 0);
            const overdueText = [
              computed.daysRemaining != null && computed.daysRemaining < 0
                ? "متأخر " + Math.abs(computed.daysRemaining) + " يومًا"
                : "",
              computed.kmRemaining != null && computed.kmRemaining < 0
                ? Math.abs(computed.kmRemaining).toLocaleString("en-US") + " كم"
                : "",
            ]
              .filter(Boolean)
              .join(" · ");

            const dueSoonText = [
              computed.daysRemaining != null ? "متبقي " + computed.daysRemaining + " يومًا" : "",
              computed.kmRemaining != null ? computed.kmRemaining.toLocaleString("en-US") + " كم" : "",
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <article key={reminder.id} className="rounded-2xl bg-panel p-4 ring-1 ring-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{reminder.title}</p>
                      <StatusBadge tone={tones[computed.status]}>{labels[computed.status]}</StatusBadge>
                      {reminder.document_id ? <StatusBadge tone="brand">من مستند</StatusBadge> : null}
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">{reminder.vehicle?.name ?? "السيارة"}</p>
                  </div>
                  <div className="text-left text-xs text-ink-soft">
                    {reminder.due_date ? <p>{formatDate(reminder.due_date)}</p> : null}
                    {reminder.due_odometer != null ? <p>{formatKm(reminder.due_odometer)}</p> : null}
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  {computed.status === "overdue" && overdueText ? (
                    <p className="text-destructive">{overdueText}</p>
                  ) : computed.status === "due_soon" && dueSoonText ? (
                    <p className="text-accent">{dueSoonText}</p>
                  ) : null}
                  {reminder.notes ? <p className="mt-1 text-ink-soft">{reminder.notes}</p> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!reminder.document_id ? (
                    <>
                      <button
                        className={secondaryBtn}
                        onClick={() => {
                          setSelected(reminder);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" /> تعديل
                      </button>

                      {reminder.status === "active" ? (
                        <button
                          className={secondaryBtn}
                          onClick={() =>
                            setStatus.mutate(
                              { id: reminder.id, status: "completed" },
                              {
                                onSuccess: () => toast.success("تم إكمال التذكير"),
                                onError: (error) => toast.error(errorMessage(error)),
                              },
                            )
                          }
                        >
                          <Check className="size-4" /> مكتمل
                        </button>
                      ) : null}

                      <ConfirmDialog
                        title="حذف التذكير؟"
                        description="سيتم حذف التذكير نهائيًا."
                        confirmLabel="حذف"
                        onConfirm={() =>
                          remove.mutate(reminder.id, {
                            onSuccess: () => toast.success("تم حذف التذكير"),
                            onError: (error) => toast.error(errorMessage(error)),
                          })
                        }
                        trigger={
                          <button className={secondaryBtn + " text-destructive"}>
                            <Trash2 className="size-4" /> حذف
                          </button>
                        }
                      />
                    </>
                  ) : (
                    <span className="rounded-xl bg-secondary px-3 py-2 text-xs text-ink-soft">
                      يُدار تلقائيًا من المستند المرتبط
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="لا توجد تذكيرات مطابقة"
          description="أضف تذكيرًا يدويًا أو مستندًا بتاريخ انتهاء."
          action={
            <button className={primaryBtn} onClick={() => setFormOpen(true)}>
              <Plus className="size-4" /> إضافة تذكير
            </button>
          }
        />
      )}

      <ReminderForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelected(null);
        }}
        vehicles={vehiclesQ.data ?? []}
        reminder={selected}
      />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="num mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
