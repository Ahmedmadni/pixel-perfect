import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FaultAnalysis {
  summary: string;
  overall_risk: "low" | "medium" | "high" | "critical";
  patterns: { title: string; codes: string[]; explanation: string }[];
  root_causes: { cause: string; likelihood: "high" | "medium" | "low"; related_codes: string[] }[];
  recommendations: { action: string; priority: "now" | "soon" | "later"; details: string }[];
  disclaimer: string;
}

const Input = z.object({ vehicleId: z.string().uuid() });

export const analyzeVehicleFaults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<FaultAnalysis> => {
    const sb = context.supabase as unknown as { from: (t: string) => any };
    const [v, d, m] = await Promise.all([
      sb.from("vehicles").select("name,manufacturer,model,model_year,engine,fuel_type,current_odometer").eq("id", data.vehicleId).maybeSingle(),
      sb.from("diagnostic_issues").select("title,symptoms,obd_codes,severity,status,first_detected_date,first_odometer,confirmed_cause,repair_actions,resolution").eq("vehicle_id", data.vehicleId).order("first_detected_date", { ascending: false }).limit(40),
      sb.from("maintenance_records").select("service_date,odometer,item:maintenance_items(name_ar)").eq("vehicle_id", data.vehicleId).order("service_date", { ascending: false }).limit(20),
    ]);
    if (v.error || !v.data) throw new Error("السيارة غير موجودة أو لا تملك صلاحية عليها.");
    const issues = (d.data ?? []) as { obd_codes: string[] }[];
    if (!issues.length) throw new Error("لا توجد أعطال مسجلة لهذه السيارة لتحليلها.");
    const codes = [...new Set(issues.flatMap(i => i.obd_codes ?? []))];
    const lib = codes.length ? (await sb.from("obd_fault_codes").select("code,description,category").in("code", codes)).data ?? [] : [];

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("خدمة الذكاء الاصطناعي غير مهيأة.");
    const instructions = `أنت خبير تشخيص أعطال سيارات. حلّل أكواد OBD-II وسجل الأعطال والصيانة لهذه السيارة واكتشف الأنماط المتكررة والأسباب الجذرية المشتركة. اكتب بالعربية ولا تخترع بيانات غير موجودة. أعد JSON فقط بهذا الشكل:
{"summary":string,"overall_risk":"low"|"medium"|"high"|"critical","patterns":[{"title":string,"codes":[string],"explanation":string}],"root_causes":[{"cause":string,"likelihood":"high"|"medium"|"low","related_codes":[string]}],"recommendations":[{"action":string,"priority":"now"|"soon"|"later","details":string}],"disclaimer":string}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort: "low" }, instructions,
        input: JSON.stringify({ vehicle: v.data, issues, code_library: lib, maintenance: m.data ?? [], today: new Date().toISOString().slice(0, 10) }),
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error("طلبات كثيرة، حاول بعد قليل.");
      if (res.status === 402) throw new Error("نفد رصيد الذكاء الاصطناعي في مساحة العمل.");
      throw new Error(`تعذّر الحصول على التحليل (${res.status}).`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let ev: { type?: string; delta?: string } | null = null;
        try { ev = JSON.parse(payload); } catch { continue; }
        if (ev?.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev?.type === "response.failed" || ev?.type === "error") throw new Error("تعذّر إكمال التحليل.");
      }
    }
    try {
      const p = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as FaultAnalysis;
      return { ...p, patterns: p.patterns ?? [], root_causes: p.root_causes ?? [], recommendations: p.recommendations ?? [] };
    } catch {
      throw new Error("لم يُفهم رد النموذج، حاول مرة أخرى.");
    }
  });
