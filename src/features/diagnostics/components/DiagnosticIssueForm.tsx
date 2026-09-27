import { useEffect, useMemo, useState } from "react";
import { Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import type { MaintenanceRecord } from "@/features/maintenance/services/maintenance.service";
import type { Part } from "@/features/parts/services/parts.service";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import { useSaveDiagnosticIssue } from "../hooks/useDiagnostics";
import { DIAGNOSTIC_SEVERITY_LABELS, DIAGNOSTIC_STATUS_LABELS } from "../lib/analytics";
import type { DiagnosticIssue, DiagnosticIssueInput, DiagnosticSeverity, DiagnosticStatus } from "../services/diagnostics.service";

const inputClass="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const today=()=>new Date().toLocaleDateString("en-CA");

export function DiagnosticIssueForm({open,onOpenChange,vehicles,parts,maintenanceRecords,vehicleId,issue}:{open:boolean;onOpenChange:(v:boolean)=>void;vehicles:Vehicle[];parts:Part[];maintenanceRecords:MaintenanceRecord[];vehicleId?:string;issue?:DiagnosticIssue|null}){
  const save=useSaveDiagnosticIssue();
  const [codes,setCodes]=useState("");
  const [attachment,setAttachment]=useState<File|null>(null);
  const [removeAttachment,setRemoveAttachment]=useState(false);
  const [form,setForm]=useState<DiagnosticIssueInput>({
    vehicle_id:vehicleId??vehicles[0]?.id??"",title:"",symptoms:null,obd_codes:[],severity:"medium",status:"open",
    first_detected_date:today(),first_odometer:null,suspected_cause:null,confirmed_cause:null,resolution:null,
    resolved_date:null,resolved_odometer:null,maintenance_record_id:null,part_id:null,notes:null,
  });

  useEffect(()=>{
    if(!open)return;
    const v=vehicleId??issue?.vehicle_id??vehicles[0]?.id??"";
    setForm({
      vehicle_id:v,
      title:issue?.title??"",
      symptoms:issue?.symptoms??null,
      obd_codes:issue?.obd_codes??[],
      severity:issue?.severity??"medium",
      status:issue?.status??"open",
      first_detected_date:issue?.first_detected_date??today(),
      first_odometer:issue?.first_odometer??null,
      suspected_cause:issue?.suspected_cause??null,
      confirmed_cause:issue?.confirmed_cause??null,
      resolution:issue?.resolution??null,
      resolved_date:issue?.resolved_date??null,
      resolved_odometer:issue?.resolved_odometer??null,
      maintenance_record_id:issue?.maintenance_record_id??null,
      part_id:issue?.part_id??null,
      notes:issue?.notes??null,
    });
    setCodes((issue?.obd_codes??[]).join(", "));
    setAttachment(null);setRemoveAttachment(false);
  },[open,issue,vehicleId,vehicles]);

  const vehicleParts=useMemo(()=>parts.filter(p=>p.fitments.some(f=>f.vehicle_id===form.vehicle_id)),[parts,form.vehicle_id]);
  const vehicleRecords=useMemo(()=>maintenanceRecords.filter(r=>r.vehicle_id===form.vehicle_id),[maintenanceRecords,form.vehicle_id]);
  const set=<K extends keyof DiagnosticIssueInput>(k:K,v:DiagnosticIssueInput[K])=>setForm(p=>({...p,[k]:v}));

  function submit(e:React.FormEvent){
    e.preventDefault();
    const obd_codes=codes.split(/[\s,;]+/).map(v=>v.trim().toUpperCase()).filter(Boolean);
    save.mutate({input:{...form,obd_codes},opts:{id:issue?.id,attachment,removeAttachment,oldAttachment:issue?.attachment_url??null}},{
      onSuccess:()=>{toast.success(issue?"تم تحديث العطل":"تم تسجيل العطل");onOpenChange(false);},
      onError:err=>toast.error(errorMessage(err)),
    });
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
    <DialogHeader className="text-right"><DialogTitle>{issue?"تعديل العطل":"تسجيل عطل جديد"}</DialogTitle><DialogDescription>وثّق العرض والكود والسياق حتى تستطيع مقارنة العطل إذا عاد لاحقًا.</DialogDescription></DialogHeader>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field label="السيارة"><select className={inputClass} value={form.vehicle_id} disabled={!!vehicleId} onChange={e=>set("vehicle_id",e.target.value)}>{vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
      <Field label="عنوان العطل"><input className={inputClass} placeholder="مثال: تفتفة عند التشغيل البارد" value={form.title} onChange={e=>set("title",e.target.value)}/></Field>
      <Field label="تاريخ أول ظهور"><input className={inputClass} type="date" max={today()} value={form.first_detected_date} onChange={e=>set("first_detected_date",e.target.value)}/></Field>
      <Field label="العداد عند الظهور"><input className={inputClass} type="number" min="0" value={form.first_odometer??""} onChange={e=>set("first_odometer",e.target.value?Number(e.target.value):null)}/></Field>
      <Field label="الخطورة"><select className={inputClass} value={form.severity} onChange={e=>set("severity",e.target.value as DiagnosticSeverity)}>{(Object.keys(DIAGNOSTIC_SEVERITY_LABELS) as DiagnosticSeverity[]).map(s=><option key={s} value={s}>{DIAGNOSTIC_SEVERITY_LABELS[s]}</option>)}</select></Field>
      <Field label="الحالة"><select className={inputClass} value={form.status} onChange={e=>set("status",e.target.value as DiagnosticStatus)}>{(Object.keys(DIAGNOSTIC_STATUS_LABELS) as DiagnosticStatus[]).map(s=><option key={s} value={s}>{DIAGNOSTIC_STATUS_LABELS[s]}</option>)}</select></Field>
      <div className="sm:col-span-2"><Field label="أكواد OBD"><input dir="ltr" className={inputClass} placeholder="P0441, P0171" value={codes} onChange={e=>setCodes(e.target.value)}/></Field></div>
      <div className="sm:col-span-2"><Field label="الأعراض"><textarea className={inputClass+" min-h-20"} value={form.symptoms??""} onChange={e=>set("symptoms",e.target.value||null)}/></Field></div>
      <Field label="السبب المحتمل"><textarea className={inputClass} value={form.suspected_cause??""} onChange={e=>set("suspected_cause",e.target.value||null)}/></Field>
      <Field label="السبب المؤكد"><textarea className={inputClass} value={form.confirmed_cause??""} onChange={e=>set("confirmed_cause",e.target.value||null)}/></Field>
      <Field label="قطعة مرتبطة"><select className={inputClass} value={form.part_id??""} onChange={e=>set("part_id",e.target.value||null)}><option value="">بدون</option>{vehicleParts.map(p=><option key={p.id} value={p.id}>{p.name_ar}{p.part_number?" — "+p.part_number:""}</option>)}</select></Field>
      <Field label="صيانة مرتبطة"><select className={inputClass} value={form.maintenance_record_id??""} onChange={e=>set("maintenance_record_id",e.target.value||null)}><option value="">بدون</option>{vehicleRecords.map(r=><option key={r.id} value={r.id}>{r.item?.name_ar??"صيانة"} — {r.service_date}</option>)}</select></Field>

      {form.status==="resolved"?<>
        <Field label="تاريخ الحل"><input className={inputClass} type="date" max={today()} value={form.resolved_date??""} onChange={e=>set("resolved_date",e.target.value||null)}/></Field>
        <Field label="العداد عند الحل"><input className={inputClass} type="number" min="0" value={form.resolved_odometer??""} onChange={e=>set("resolved_odometer",e.target.value?Number(e.target.value):null)}/></Field>
        <div className="sm:col-span-2"><Field label="الحل / الإجراء النهائي"><textarea className={inputClass+" min-h-20"} value={form.resolution??""} onChange={e=>set("resolution",e.target.value||null)}/></Field></div>
      </>:null}

      <div className="sm:col-span-2"><Field label="ملاحظات"><textarea className={inputClass} value={form.notes??""} onChange={e=>set("notes",e.target.value||null)}/></Field></div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">صورة أو تقرير فحص</label>
        <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm"><span className="flex min-w-0 items-center gap-2 text-ink-soft"><Paperclip className="size-4"/><span className="truncate">{attachment?.name??(issue?.attachment_url?"استبدال المرفق الحالي":"PDF أو صورة، بحد أقصى 10 MB")}</span></span><input className="sr-only" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e=>setAttachment(e.target.files?.[0]??null)}/><span className={secondaryBtn}>اختيار ملف</span></label>
        {issue?.attachment_url?<label className="mt-2 flex items-center gap-2 text-xs text-ink-soft"><input type="checkbox" checked={removeAttachment} onChange={e=>setRemoveAttachment(e.target.checked)}/> حذف المرفق الحالي</label>:null}
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={secondaryBtn} onClick={()=>onOpenChange(false)}>إلغاء</button><button className={primaryBtn} disabled={save.isPending||!form.title.trim()}><Save className="size-4"/>{save.isPending?"جارٍ الحفظ...":"حفظ العطل"}</button></div>
    </form>
  </DialogContent></Dialog>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-medium">{label}{children}</label>;}
