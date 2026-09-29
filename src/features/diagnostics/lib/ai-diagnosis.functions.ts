import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AiDiagnosis {
  summary: string;
  urgency: "low" | "medium" | "high" | "critical";
  safe_to_drive: boolean;
  causes: { cause: string; likelihood: "high" | "medium" | "low"; reasoning: string }[];
  steps: { step: string; details: string }[];
  history_notes: string[];
  disclaimer: string;
}

const Input = z.object({ vehicleId: z.string().uuid(), symptoms: z.string().trim().min(5).max(2000) });

export const diagnoseSymptoms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }): Promise<AiDiagnosis> => {
    const sb = context.supabase;
    const [v, m, d] = await Promise.all([
      sb.from("vehicles").select("name,manufacturer,model,model_year,engine,fuel_type,transmission,current_odometer,purchase_date").eq("id", data.vehicleId).maybeSingle(),
      sb.from("maintenance_records").select("service_date,odometer,notes,item:maintenance_items(name_ar)").eq("vehicle_id", data.vehicleId).order("service_date", { ascending: false }).limit(30),
      (sb as unknown as { from: (t: string) => any }).from("diagnostic_issues").select("title,symptoms,obd_codes,status,first_detected_date,confirmed_cause,resolution").eq("vehicle_id", data.vehicleId).order("first_detected_date", { ascending: false }).limit(15),
    ]);
    if (v.error || !v.data) throw new Error("السيارة غير موجودة أو لا تملك صلاحية عليها.");

    const history = { vehicle: v.data, maintenance: m.data ?? [], previous_issues: d.data ?? [], today: new Date().toISOString().slice(0, 10) };
    const system = `أنت فني تشخيص سيارات خبير. حلل الأعراض التي يصفها المالك مستنداً إلى بيانات السيارة وسجل صيانتها وأعطالها السابقة. اكتب بالعربية. أعد JSON فقط بلا أي نص آخر بهذا الشكل:
{"summary":string,"urgency":"low"|"medium"|"high"|"critical","safe_to_drive":boolean,"causes":[{"cause":string,"likelihood":"high"|"medium"|"low","reasoning":string}],"steps":[{"step":string,"details":string}],"history_notes":[string],"disclaimer":string}
من 2 إلى 5 أسباب مرتبة حسب الاحتمال، ومن 3 إلى 6 خطوات. في history_notes اذكر ما يربط الأعراض بالسجل (صيانة متأخرة، عطل سابق عاد...). لا تخترع سجلات غير موجودة.`;

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("خدمة الذكاء الاصطناعي غير مهيأة.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: system,
        input: `بيانات السيارة وسجلها:\n${JSON.stringify(history)}\n\nالأعراض التي يصفها المالك:\n${data.symptoms}`,
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error("طلبات كثيرة، حاول بعد قليل.");
      if (res.status === 402) throw new Error("نفد رصيد الذكاء الاصطناعي في مساحة العمل.");
      throw new Error(`تعذّر الحصول على التشخيص (${res.status}).`);
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
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          if (ev.type === "response.failed" || ev.type === "error") throw new Error("تعذّر إكمال التشخيص.");
        } catch (e) {
          if (e instanceof Error && e.message.startsWith("تعذّر")) throw e;
        }
      }
    }
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    try {
      const p = JSON.parse(json) as AiDiagnosis;
      return { ...p, causes: p.causes ?? [], steps: p.steps ?? [], history_notes: p.history_notes ?? [] };
    } catch {
      throw new Error("لم يُفهم رد النموذج، حاول مرة أخرى.");
    }
  });
