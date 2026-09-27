import type { Reminder } from "../services/reminders.service";

export type ReminderComputedStatus = "ok" | "due_soon" | "due" | "overdue" | "completed" | "dismissed";
export const REMINDER_DUE_SOON_DAYS = 30;
export const REMINDER_DUE_SOON_KM = 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function daysBetween(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

export function computeReminderStatus(
  reminder: Pick<Reminder, "status" | "due_date" | "due_odometer">,
  currentOdometer: number,
  today = new Date(),
): { status: ReminderComputedStatus; daysRemaining: number | null; kmRemaining: number | null } {
  if (reminder.status === "completed") return { status: "completed", daysRemaining: null, kmRemaining: null };
  if (reminder.status === "dismissed") return { status: "dismissed", daysRemaining: null, kmRemaining: null };

  const daysRemaining = reminder.due_date ? daysBetween(today, new Date(reminder.due_date + "T00:00:00")) : null;
  const kmRemaining = reminder.due_odometer != null ? reminder.due_odometer - currentOdometer : null;

  if ((daysRemaining != null && daysRemaining < 0) || (kmRemaining != null && kmRemaining < 0)) {
    return { status: "overdue", daysRemaining, kmRemaining };
  }
  if ((daysRemaining != null && daysRemaining === 0) || (kmRemaining != null && kmRemaining === 0)) {
    return { status: "due", daysRemaining, kmRemaining };
  }
  if ((daysRemaining != null && daysRemaining <= REMINDER_DUE_SOON_DAYS) || (kmRemaining != null && kmRemaining <= REMINDER_DUE_SOON_KM)) {
    return { status: "due_soon", daysRemaining, kmRemaining };
  }
  return { status: "ok", daysRemaining, kmRemaining };
}

const rank: Record<ReminderComputedStatus, number> = {
  overdue: 0, due: 1, due_soon: 2, ok: 3, completed: 4, dismissed: 5,
};

export function sortReminders(reminders: Reminder[], today = new Date()): Reminder[] {
  return [...reminders].sort((a, b) => {
    const aStatus = computeReminderStatus(a, a.vehicle?.current_odometer ?? 0, today).status;
    const bStatus = computeReminderStatus(b, b.vehicle?.current_odometer ?? 0, today).status;
    return rank[aStatus] - rank[bStatus]
      || (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31")
      || (a.due_odometer ?? Number.MAX_SAFE_INTEGER) - (b.due_odometer ?? Number.MAX_SAFE_INTEGER);
  });
}

export function summarizeReminders(reminders: Reminder[], today = new Date()) {
  const statuses = reminders.map(r => computeReminderStatus(r, r.vehicle?.current_odometer ?? 0, today).status);
  return {
    total: reminders.length,
    overdue: statuses.filter(s => s === "overdue").length,
    due: statuses.filter(s => s === "due").length,
    dueSoon: statuses.filter(s => s === "due_soon").length,
    active: statuses.filter(s => ["overdue","due","due_soon","ok"].includes(s)).length,
  };
}
