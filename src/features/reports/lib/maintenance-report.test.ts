import { describe, expect, it } from "vitest";
import type { MaintenanceRecord } from "@/features/maintenance/services/maintenance.service";
import type { DiagnosticIssue } from "@/features/diagnostics/services/diagnostics.service";
import type { PartInstallation } from "@/features/parts/services/parts.service";
import { buildMaintenanceReport, serviceCost, installationCost } from "./maintenance-report";

const service = (id:string, vehicle_id="v1"):MaintenanceRecord => ({id,vehicle_id,maintenance_item_id:"oil",service_date:"2026-11-01",odometer:50000,parts_cost:200,labor_cost:100,other_cost:50,total_cost:350,workshop_name:null,technician_name:null,notes:null,invoice_url:null,created_at:"2026-11-01",item:{name_ar:"زيت"}});
const part = (id:string, maintenance_record_id:string|null,vehicle_id="v1"):PartInstallation => ({id,vehicle_id,part_id:"filter",maintenance_record_id,supplier_id:null,install_date:"2026-11-01",odometer:50000,quantity:2,unit_price:50,other_cost:20,total_cost:120,receipt_url:null,notes:null,part:{name_ar:"فلتر",part_number:"123"},supplier:null});
describe("comprehensive maintenance report",() => {
  it("scopes service, faults and parts to the chosen vehicle",() => {
    const faults = [{vehicle_id:"v1",first_detected_date:"2026-11-01",obd_codes:["P0171"]},{vehicle_id:"v2",first_detected_date:"2026-11-01",obd_codes:["P0300"]}] as DiagnosticIssue[];
    const report=buildMaintenanceReport("v1",[service("m1"),service("m2","v2")],faults,[part("p1",null),part("p2",null,"v2")]);
    expect(report.services.map(r=>r.id)).toEqual(["m1"]);
    expect(report.codes).toEqual(["P0171"]);
    expect(report.parts.map(r=>r.id)).toEqual(["p1"]);
    expect(report.total).toBe(470);
  });
  it("does not add maintenance-linked installation costs again",() => {
    const report=buildMaintenanceReport("v1",[service("m1")],[],[part("linked","m1"),part("independent",null)]);
    expect(report.maintenanceCost).toBe(350);
    expect(report.independentPartsCost).toBe(120);
    expect(report.linkedPartsCost).toBe(120);
    expect(report.total).toBe(470);
  });
  it("derives a missing service total from all three cost components",() => {
    expect(serviceCost({...service("m1"),total_cost:null})).toBe(350);
  });
  it("derives a missing installation total from quantity, unit price and other costs",() => {
    const row=part("p1",null);
    expect(installationCost({...row,total_cost:null} as unknown as PartInstallation)).toBe(120);
  });
  it("keeps full historical records regardless of age and deduplicates codes",() => {
    const faults = [{vehicle_id:"v1",first_detected_date:"2020-01-01",obd_codes:["P0171","P0171"]}] as DiagnosticIssue[];
    const report=buildMaintenanceReport("v1",[{...service("old"),service_date:"2020-01-01"},service("new")],faults,[]);
    expect(report.services.map(r=>r.id)).toEqual(["new","old"]);
    expect(report.codes).toEqual(["P0171"]);
    expect(report.faults).toHaveLength(1);
  });
});