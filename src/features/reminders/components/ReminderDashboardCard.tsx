import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import { QueryErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/types/vehicle";
import { useReminders } from "../hooks/useReminders";
import { computeReminderStatus, sortReminders, summarizeReminders } from "../lib/engine";

export function ReminderDashboardCard({ vehicle }: { vehicle: Vehicle }) {
  const query = useReminders(vehicle.id);

  if (query.isPending) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => query.refetch()} />;

  const reminders = sortReminders(query.data ?? []);
  const summary = summarizeReminders(reminders);
  const top = reminders.find((reminder) =>
    ["overdue", "due", "due_soon"].includes(
      computeReminderStatus(reminder, vehicle.current_odometer).status,
    ),
  );

  return (
    <section className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4 text-brand-deep" /> التذكيرات
          </p>
          <p className="num mt-3 text-3xl font-semibold">{summary.active}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {summary.overdue} متأخر · {summary.dueSoon} قريب
          </p>
        </div>
        <Link to="/reminders" className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep">
          التفاصيل <ArrowLeft className="size-3.5" />
        </Link>
      </div>

      {top ? (
        <div className="mt-4 rounded-xl bg-secondary p-3">
          <p className="text-sm font-medium">{top.title}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {top.due_date ??
              (top.due_odometer != null ? top.due_odometer.toLocaleString("en-US") + " كم" : "")}
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-success/5 p-3 text-sm text-success">
          لا توجد تذكيرات عاجلة.
        </p>
      )}
    </section>
  );
}
