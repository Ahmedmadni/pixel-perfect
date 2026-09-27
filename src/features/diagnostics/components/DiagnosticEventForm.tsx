import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { useSaveDiagnosticEvent } from "../hooks/useDiagnostics";
import type { DiagnosticEventInput, DiagnosticEventType, DiagnosticIssue } from "../services/diagnostics.service";

const labels:Record<DiagnosticEventType,string>={observed:"ملاحظة جديدة",tested:"اختبار / فحص",repaired:"تم إصلاحه",returned:"عاد العطل",note:"ملاحظة"};
const inputClass="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const today=()=>new Date().toLocaleDateString("en-CA");

export function DiagnosticEventForm({open,onOpenChange,issue}:{open:boolean;onOpenChange:(v:boolean)=>void;issue:DiagnosticIssue|null}){
  const save=useSaveDiagnosticEvent();
  const [form,setForm]=useState<DiagnosticEventInput>({issue_id:"",event_date:today(),odometer:null,event_type:"note",details:""});
  useEffect(()=>{if(open&&issue)setForm({issue_id:issue.id,event_date:today(),odometer:null,event_type:"note",details:""});},[open,issue]);
  if(!issue)return null;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="sm:max-w-lg">
    <DialogHeader className="text-right"><DialogTitle>إضافة حدث للعطل</DialogTitle><DialogDescription>{issue.title} — سجّل اختبارًا أو إصلاحًا أو عودة المشكلة.</DialogDescription></DialogHeader>
    <form className="grid gap-4" onSubmit={e=>{e.preventDefault();save.mutate(form,{onSuccess:()=>{toast.success("تمت إضافة الحدث");onOpenChange(false);},onError:err=>toast.error(errorMessage(err))});}}>
      <label className="text-sm font-medium">نوع الحدث<select className={inputClass} value={form.event_type} onChange={e=>setForm(p=>({...p,event_type:e.target.value as DiagnosticEventType}))}>{(Object.keys(labels) as DiagnosticEventType[]).map(t=><option key={t} value={t}>{labels[t]}</option>)}</select></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">التاريخ<input className={inputClass} type="date" max={today()} value={form.event_date} onChange={e=>setForm(p=>({...p,event_date:e.target.value}))}/></label>
        <label className="text-sm font-medium">العداد<input className={inputClass} type="number" min="0" value={form.odometer??""} onChange={e=>setForm(p=>({...p,odometer:e.target.value?Number(e.target.value):null}))}/></label>
      </div>
      <label className="text-sm font-medium">التفاصيل<textarea className={inputClass+" min-h-28"} value={form.details} onChange={e=>setForm(p=>({...p,details:e.target.value}))}/></label>
      <div className="flex justify-end gap-2"><button type="button" className={secondaryBtn} onClick={()=>onOpenChange(false)}>إلغاء</button><button className={primaryBtn} disabled={save.isPending||!form.details.trim()}><Save className="size-4"/>حفظ الحدث</button></div>
    </form>
  </DialogContent></Dialog>;
}
