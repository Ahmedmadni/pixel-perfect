import { describe, expect, it } from "vitest";
import { linkSymptomHistory, type HistoryContext } from "./history-links";

function fixture(): HistoryContext {
  return {
    vehicleId: "car-a", currentOdometer: 17000, today: "2026-10-26",
    symptoms: [{ id: "symptom", name: "اهتزاز عند الفرملة", description: null, category: null,
      causes: [{ id: "cause", symptom_id: "symptom", cause: "تآكل الفرامل", maintenance_item_id: "brakes", km_threshold: null, base_likelihood: "medium", steps: "افحص الأقراص" }] }],
    items: [{ id: "brakes", category_id: null, user_id: null, name_ar: "فحص الفرامل", default_interval_km: 7000, default_interval_months: null, is_system: true, sort_order: 1 }],
    schedules: [],
    records: [{ id: "service", vehicle_id: "car-a", maintenance_item_id: "brakes", service_date: "2026-01-01", odometer: 10000, parts_cost: 0, labor_cost: 0, other_cost: 0, total_cost: 0, workshop_name: null, technician_name: null, notes: null, invoice_url: null, created_at: "2026-01-01", item: { name_ar: "فحص الفرامل" } }],
    issues: [{ id: "issue", vehicle_id: "car-a", title: "اهتزاز عند الفرملة", symptoms: null,
      operating_conditions: null, diagnostic_summary: null, obd_codes: [], severity: "medium", status: "open",
      first_detected_date: "2026-10-20", first_odometer: 16500, suspected_cause: null, confirmed_cause: null,
      root_cause_explanation: null, repair_actions: null, verification_result: null, prevention_notes: null,
      safe_to_drive: null, resolution: null, resolved_date: null, resolved_odometer: null,
      maintenance_record_id: null, part_id: null, attachment_url: null, notes: null,
      created_at: "2026-10-20", updated_at: "2026-10-20", events: [], tests: [] }],
  };
}

describe("symptoms linked to maintenance and faults", () => {
  it("shows an active matching fault when maintenance reaches its odometer due point", () => {
    expect(linkSymptomHistory(fixture())[0]?.maintenanceDue).toBe(true);
  });
  it("does not label catalog symptoms without an active fault as due repairs", () => {
    const c = fixture(); c.issues = [];
    expect(linkSymptomHistory(c)[0]?.maintenanceDue).toBe(false);
  });
  it("keeps resolved issues in history without raising a due alert", () => {
    const c = fixture(); c.issues = c.issues.map((i) => ({ ...i, status: "resolved" }));
    const link = linkSymptomHistory(c)[0];
    expect(link?.linkedIssues).toHaveLength(1);
    expect(link?.maintenanceDue).toBe(false);
  });
  it("isolates all histories by vehicle", () => {
    const c = fixture(); c.vehicleId = "car-b";
    const link = linkSymptomHistory(c)[0];
    expect(link?.linkedIssues).toHaveLength(0);
    expect(link?.relatedRecords).toHaveLength(0);
    expect(link?.maintenanceDue).toBe(false);
  });
  it("uses the latest repair to clear a due maintenance alert", () => {
    const c = fixture(); c.records = c.records.map((r) => ({ ...r, odometer: 17000, service_date: "2026-10-26" }));
    expect(linkSymptomHistory(c)[0]?.maintenanceDue).toBe(false);
  });
  it("honors date-based due maintenance with no odometer interval", () => {
    const c = fixture(); c.currentOdometer = 10000;
    c.items = c.items.map((i) => ({ ...i, default_interval_km: null, default_interval_months: 6 }));
    expect(linkSymptomHistory(c)[0]?.maintenanceDue).toBe(true);
  });
  it("honors disabled schedules", () => {
    const c = fixture(); c.schedules = [{ id: "schedule", vehicle_id: "car-a", maintenance_item_id: "brakes", interval_km: 7000, interval_months: null, last_service_date: "2026-01-01", last_service_odometer: 10000, next_due_odometer: 17000, next_due_date: null, is_enabled: false, item: null }];
    expect(linkSymptomHistory(c)[0]?.maintenanceDue).toBe(false);
  });
  it("matches explicit maintenance record links even when the title differs", () => {
    const c = fixture(); c.issues = c.issues.map((i) => ({ ...i, title: "ضوضاء", maintenance_record_id: "service" }));
    expect(linkSymptomHistory(c)[0]?.maintenanceDue).toBe(true);
  });
  it("uses the configured kilometers-since-service threshold", () => {
    const c = fixture(); c.currentOdometer = 12000;
    c.symptoms = c.symptoms.map((s) => ({ ...s, causes: s.causes.map((cause) => ({ ...cause, km_threshold: 2000 })) }));
    expect(linkSymptomHistory(c)[0]?.maintenanceDue).toBe(true);
  });
});