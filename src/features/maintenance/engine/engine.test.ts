import { describe, expect, it } from "vitest";
import { calculateMaintenanceStatus, calculateNextDue, odometerAfterService, rebuildFromRecords } from "./engine";

const base = { interval_km: 5000, interval_months: null, last_service_date: "2026-01-01", last_service_odometer: 100000, is_enabled: true };
const today = "2026-02-01";

describe("maintenance engine", () => {
  it("T1 OK with 2000 remaining", () => {
    const e = calculateMaintenanceStatus(base, 103000, today);
    expect(e.next_due_odometer).toBe(105000);
    expect(e.kmRemaining).toBe(2000);
    expect(e.status).toBe("OK");
  });
  it("T2 DUE_SOON", () => {
    const e = calculateMaintenanceStatus(base, 104500, today);
    expect(e.kmRemaining).toBe(500);
    expect(e.status).toBe("DUE_SOON");
  });
  it("T3 DUE", () => expect(calculateMaintenanceStatus(base, 105000, today).status).toBe("DUE"));
  it("T4 OVERDUE by 1250", () => {
    const e = calculateMaintenanceStatus(base, 106250, today);
    expect(e.status).toBe("OVERDUE");
    expect(e.kmRemaining).toBe(-1250);
  });
  it("T5 due by date before km", () => {
    const s = { ...base, interval_months: 6 };
    const e = calculateMaintenanceStatus(s, 101000, "2026-06-20");
    expect(e.next_due_date).toBe("2026-07-01");
    expect(e.status).toBe("DUE_SOON");
    expect(e.reason).toBe("time");
  });
  it("T6 overdue by date not km", () => {
    const e = calculateMaintenanceStatus({ ...base, interval_months: 6 }, 101000, "2026-07-19");
    expect(e.status).toBe("OVERDUE");
    expect(e.daysRemaining).toBe(-18);
    expect(e.reason).toBe("time");
  });
  it("T7 historical record never decreases odometer", () => {
    expect(odometerAfterService(194000, 180000)).toBe(194000);
    expect(odometerAfterService(194000, 195000)).toBe(195000);
  });
  it("T8 delete latest rebuilds from previous", () => {
    const recs = [
      { service_date: "2026-01-01", odometer: 180000, created_at: "a" },
      { service_date: "2026-09-26", odometer: 190000, created_at: "b" },
    ];
    const after = rebuildFromRecords(recs.slice(0, 1));
    expect(after).toEqual({ last_service_date: "2026-01-01", last_service_odometer: 180000 });
    expect(rebuildFromRecords([])).toEqual({ last_service_date: null, last_service_odometer: null });
  });
  it("spec example: 190000 / 2026-09-26 + 7000/6m", () => {
    expect(calculateNextDue({ interval_km: 7000, interval_months: 6, last_service_date: "2026-09-26", last_service_odometer: 190000 }))
      .toEqual({ next_due_odometer: 197000, next_due_date: "2027-03-26" });
  });
  it("no history", () => {
    expect(calculateMaintenanceStatus({ ...base, last_service_date: null, last_service_odometer: null }, 1, today).status).toBe("NO_HISTORY");
  });
});
