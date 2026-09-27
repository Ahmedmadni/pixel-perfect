import { describe, expect, it } from "vitest";
import { computeReminderStatus, summarizeReminders } from "./engine";
import type { Reminder } from "../services/reminders.service";

function reminder(partial: Partial<Reminder>): Reminder {
  return {
    id: "r1",
    vehicle_id: "v1",
    title: "تذكير",
    reminder_type: "custom",
    due_date: null,
    due_odometer: null,
    recurring_months: null,
    recurring_km: null,
    status: "active",
    document_id: null,
    notes: null,
    created_at: "",
    vehicle: { name: "سيارتي", current_odometer: 100000 },
    ...partial,
  };
}

const today = new Date(2026, 8, 27);

describe("reminder engine", () => {
  it("marks overdue by odometer", () => {
    expect(computeReminderStatus(reminder({ due_odometer: 99000 }), 100000, today).status).toBe("overdue");
  });
  it("marks due soon within 1000 km", () => {
    expect(computeReminderStatus(reminder({ due_odometer: 100800 }), 100000, today).status).toBe("due_soon");
  });
  it("marks due soon within 30 days", () => {
    expect(computeReminderStatus(reminder({ due_date: "2026-10-10" }), 100000, today).status).toBe("due_soon");
  });
  it("uses whichever condition becomes urgent first", () => {
    expect(computeReminderStatus(reminder({ due_date: "2026-12-01", due_odometer: 99900 }), 100000, today).status).toBe("overdue");
  });
  it("summarizes active reminder states", () => {
    const result = summarizeReminders([
      reminder({ id:"1", due_odometer: 99900 }),
      reminder({ id:"2", due_odometer: 100500 }),
      reminder({ id:"3", due_odometer: 120000 }),
      reminder({ id:"4", status:"completed", due_odometer: 100000 }),
    ], today);
    expect(result).toEqual({ total: 4, overdue: 1, due: 0, dueSoon: 1, active: 3 });
  });
});
