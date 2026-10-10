import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export const DIAGNOSTIC_BUCKET = "diagnostic-documents";
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const FILE_MAX = 10 * 1024 * 1024;

export type DiagnosticSeverity = "low" | "medium" | "high" | "critical";
export type DiagnosticStatus = "open" | "monitoring" | "resolved" | "returned";
export type DiagnosticEventType = "observed" | "tested" | "repaired" | "returned" | "note";
export type DiagnosticTestResult = "pass" | "fail" | "inconclusive";

export interface DiagnosticEvent {
  id: string;
  issue_id: string;
  event_date: string;
  odometer: number | null;
  event_type: DiagnosticEventType;
  details: string;
  created_at: string;
}

export interface DiagnosticTest {
  id: string;
  issue_id: string;
  sequence_no: number;
  performed_date: string;
  odometer: number | null;
  system_area: string | null;
  test_name: string;
  test_method: string | null;
  expected_result: string | null;
  actual_result: string | null;
  result_status: DiagnosticTestResult;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticTestInput {
  issue_id: string;
  sequence_no: number;
  performed_date: string;
  odometer: number | null;
  system_area: string | null;
  test_name: string;
  test_method: string | null;
  expected_result: string | null;
  actual_result: string | null;
  result_status: DiagnosticTestResult;
  conclusion: string | null;
}

export interface DiagnosticIssue {
  id: string;
  vehicle_id: string;
  title: string;
  symptoms: string | null;
  operating_conditions: string | null;
  diagnostic_summary: string | null;
  obd_codes: string[];
  severity: DiagnosticSeverity;
  status: DiagnosticStatus;
  first_detected_date: string;
  first_odometer: number | null;
  suspected_cause: string | null;
  confirmed_cause: string | null;
  root_cause_explanation: string | null;
  repair_actions: string | null;
  verification_result: string | null;
  prevention_notes: string | null;
  safe_to_drive: boolean | null;
  resolution: string | null;
  resolved_date: string | null;
  resolved_odometer: number | null;
  maintenance_record_id: string | null;
  part_id: string | null;
  attachment_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    name: string;
    manufacturer: string | null;
    model: string | null;
    model_year: number | null;
    trim: string | null;
    vin: string | null;
    plate_number: string | null;
    engine: string | null;
    transmission: string | null;
    fuel_type: string | null;
    current_odometer: number;
  } | null;
  part?: { name_ar: string; part_number: string | null; manufacturer: string | null } | null;
  maintenance?: {
    id: string;
    service_date: string;
    odometer: number | null;
    cost: number;
    item: { name_ar: string } | null;
  } | null;
  events: DiagnosticEvent[];
  tests: DiagnosticTest[];
}

export interface DiagnosticIssueInput {
  vehicle_id: string;
  title: string;
  symptoms: string | null;
  operating_conditions: string | null;
  diagnostic_summary: string | null;
  obd_codes: string[];
  severity: DiagnosticSeverity;
  status: DiagnosticStatus;
  first_detected_date: string;
  first_odometer: number | null;
  suspected_cause: string | null;
  confirmed_cause: string | null;
  root_cause_explanation: string | null;
  repair_actions: string | null;
  verification_result: string | null;
  prevention_notes: string | null;
  safe_to_drive: boolean | null;
  resolution: string | null;
  resolved_date: string | null;
  resolved_odometer: number | null;
  maintenance_record_id: string | null;
  part_id: string | null;
  notes: string | null;
}

export interface DiagnosticEventInput {
  issue_id: string;
  event_date: string;
  odometer: number | null;
  event_type: DiagnosticEventType;
  details: string;
}

export async function getDiagnosticIssues(vehicleId?: string): Promise<DiagnosticIssue[]> {
  const c = requireClient();
  let q = c
    .from("diagnostic_issues")
    .select("*, vehicle:vehicles(name,manufacturer,model,model_year,trim,vin,plate_number,engine,transmission,fuel_type,current_odometer), part:parts(name_ar,part_number,manufacturer), maintenance:maintenance_records(id,service_date,odometer,cost:total_cost,item:maintenance_items(name_ar)), events:diagnostic_events(*), tests:diagnostic_tests(*)")
    .order("first_detected_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (vehicleId) q = q.eq("vehicle_id", vehicleId);
  const { data, error } = await q;
  if (error) throw toDataError(error);
  type IssueRow = Omit<DiagnosticIssue, "events" | "tests" | "obd_codes"> & {
    obd_codes: string[] | null;
    events: DiagnosticEvent[] | null;
    tests: DiagnosticTest[] | null;
  };
  return ((data ?? []) as unknown as IssueRow[]).map((row) => ({
    ...row,
    obd_codes: row.obd_codes ?? [],
    events: [...(row.events ?? [])].sort((a, b) =>
      b.event_date.localeCompare(a.event_date) || b.created_at.localeCompare(a.created_at),
    ),
    tests: [...(row.tests ?? [])].sort((a, b) =>
      a.sequence_no - b.sequence_no || a.performed_date.localeCompare(b.performed_date),
    ),
  }));
}

function today() {
  return new Date().toLocaleDateString("en-CA");
}

export function validateIssue(input: DiagnosticIssueInput): string | null {
  if (!input.vehicle_id) return "اختر السيارة.";
  if (!input.title.trim()) return "عنوان العطل مطلوب.";
  if (!input.first_detected_date) return "أدخل تاريخ ظهور العطل.";
  if (input.first_detected_date > today()) return "تاريخ ظهور العطل لا يمكن أن يكون في المستقبل.";
  if (input.first_odometer != null && (!Number.isFinite(input.first_odometer) || input.first_odometer < 0)) return "قراءة العداد غير صحيحة.";
  if (input.status === "resolved" && !input.resolved_date) return "أدخل تاريخ حل العطل.";
  if (input.status === "resolved" && !input.confirmed_cause?.trim()) return "أدخل السبب المؤكد قبل إغلاق العطل.";
  if (input.status === "resolved" && !(input.repair_actions?.trim() || input.resolution?.trim())) return "وثّق إجراء الإصلاح قبل إغلاق العطل.";
  if (input.status === "resolved" && !input.verification_result?.trim()) return "وثّق نتيجة التحقق بعد الإصلاح قبل إغلاق العطل.";
  if (input.resolved_date && input.resolved_date > today()) return "تاريخ الحل لا يمكن أن يكون في المستقبل.";
  return null;
}

function validateFile(file: File): string | null {
  if (!FILE_TYPES.includes(file.type)) return "الصيغ المسموحة: JPG/PNG/WEBP أو PDF.";
  if (file.size > FILE_MAX) return "حجم المرفق يجب ألا يتجاوز 10 ميجابايت.";
  return null;
}

export async function saveDiagnosticIssue(
  input: DiagnosticIssueInput,
  opts: { id?: string | undefined; attachment?: File | null | undefined; removeAttachment?: boolean | undefined; oldAttachment?: string | null },
) {
  const invalid = validateIssue(input);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);
  if (opts.attachment) {
    const bad = validateFile(opts.attachment);
    if (bad) throw new DataProviderError("VALIDATION_ERROR", bad);
  }
  const c = requireClient();
  const user_id = await requireUserId(c);
  const normalized = {
    ...input,
    obd_codes: input.obd_codes.map((code) => code.trim().toUpperCase()).filter(Boolean),
    resolved_date: input.status === "resolved" ? input.resolved_date : null,
    resolved_odometer: input.status === "resolved" ? input.resolved_odometer : null,
  };
  let id = opts.id;
  if (id) {
    const { data, error } = await c.from("diagnostic_issues").update(normalized).eq("id", id).select("id").maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
  } else {
    const { data, error } = await c.from("diagnostic_issues").insert({ ...normalized, user_id }).select("id").single();
    if (error) throw toDataError(error);
    id = data.id as string;
  }

  if (opts.attachment) {
    const ext = opts.attachment.name.split(".").pop()?.toLowerCase() || "bin";
    const path = [user_id, input.vehicle_id, id, String(Date.now()) + "." + ext].join("/");
    const up = await c.storage.from(DIAGNOSTIC_BUCKET).upload(path, opts.attachment, { contentType: opts.attachment.type });
    if (up.error) throw new DataProviderError("UNKNOWN", "تم حفظ العطل لكن تعذّر رفع المرفق.");
    const linked = await c.from("diagnostic_issues").update({ attachment_url: path }).eq("id", id).select("id").maybeSingle();
    if (linked.error || !linked.data) {
      await c.storage.from(DIAGNOSTIC_BUCKET).remove([path]);
      if (linked.error) throw toDataError(linked.error);
      throw new DataProviderError("NOT_FOUND");
    }
    if (opts.oldAttachment) await c.storage.from(DIAGNOSTIC_BUCKET).remove([opts.oldAttachment]);
  } else if (opts.removeAttachment && opts.oldAttachment) {
    const cleared = await c.from("diagnostic_issues").update({ attachment_url: null }).eq("id", id).select("id").maybeSingle();
    if (cleared.error) throw toDataError(cleared.error);
    if (!cleared.data) throw new DataProviderError("NOT_FOUND");
    await c.storage.from(DIAGNOSTIC_BUCKET).remove([opts.oldAttachment]);
  }
  return id;
}

export async function deleteDiagnosticIssue(issue: Pick<DiagnosticIssue, "id" | "attachment_url">) {
  const c = requireClient();
  const { data, error } = await c.from("diagnostic_issues").delete().eq("id", issue.id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
  if (issue.attachment_url) await c.storage.from(DIAGNOSTIC_BUCKET).remove([issue.attachment_url]);
}

export function validateEvent(input: DiagnosticEventInput): string | null {
  if (!input.issue_id) return "العطل غير محدد.";
  if (!input.event_date) return "أدخل تاريخ الحدث.";
  if (!input.details.trim()) return "اكتب تفاصيل الحدث.";
  if (input.odometer != null && (!Number.isFinite(input.odometer) || input.odometer < 0)) return "قراءة العداد غير صحيحة.";
  return null;
}

export async function saveDiagnosticEvent(input: DiagnosticEventInput) {
  const invalid = validateEvent(input);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);
  const c = requireClient();
  const user_id = await requireUserId(c);
  const { data, error } = await c.from("diagnostic_events").insert({ ...input, user_id }).select("id").single();
  if (error) throw toDataError(error);

  if (input.event_type === "returned") {
    await c.from("diagnostic_issues").update({ status: "returned", resolved_date: null, resolved_odometer: null }).eq("id", input.issue_id);
  }
  if (input.event_type === "repaired") {
    await c.from("diagnostic_issues").update({
      status: "monitoring",
    }).eq("id", input.issue_id);
  }
  return data.id as string;
}

export async function deleteDiagnosticEvent(id: string) {
  const c = requireClient();
  const { data, error } = await c.from("diagnostic_events").delete().eq("id", id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
}

export async function getDiagnosticDocumentUrl(path: string) {
  const c = requireClient();
  const { data, error } = await c.storage.from(DIAGNOSTIC_BUCKET).createSignedUrl(path, 300);
  if (error) throw toDataError(error);
  return data.signedUrl;
}


export function validateDiagnosticTest(input: DiagnosticTestInput): string | null {
  if (!input.issue_id) return "العطل غير محدد.";
  if (!input.test_name.trim()) return "اسم الفحص مطلوب.";
  if (!input.performed_date) return "أدخل تاريخ الفحص.";
  if (!Number.isFinite(input.sequence_no) || input.sequence_no <= 0) return "ترتيب الفحص غير صحيح.";
  if (input.odometer != null && (!Number.isFinite(input.odometer) || input.odometer < 0)) return "قراءة العداد غير صحيحة.";
  if (!input.actual_result?.trim()) return "سجّل النتيجة الفعلية للفحص.";
  return null;
}

export async function saveDiagnosticTest(input: DiagnosticTestInput, id?: string) {
  const invalid = validateDiagnosticTest(input);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);

  const c = requireClient();
  const user_id = await requireUserId(c);

  if (id) {
    const { data, error } = await c
      .from("diagnostic_tests")
      .update(input)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw toDataError(error);
    if (!data) throw new DataProviderError("NOT_FOUND");
    return id;
  }

  const { data, error } = await c
    .from("diagnostic_tests")
    .insert({ ...input, user_id })
    .select("id")
    .single();
  if (error) throw toDataError(error);
  return data.id as string;
}

export async function deleteDiagnosticTest(id: string) {
  const c = requireClient();
  const { data, error } = await c.from("diagnostic_tests").delete().eq("id", id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
}
