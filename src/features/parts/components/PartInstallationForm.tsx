import { useEffect, useMemo, useState } from "react";
import { Paperclip, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { useMaintenanceRecords } from "@/features/maintenance/hooks/useMaintenance";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import { useSavePartInstallation } from "../hooks/useParts";
import type { Part, PartInstallationInput, Supplier } from "../services/parts.service";

const inputClass="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const today=()=>new Date().toLocaleDateString("en-CA");

export function PartInstallationForm({open,onOpenChange,part,vehicles,suppliers,vehicleId}:{open:boolean;onOpenChange:(v:boolean)=>void;part:Part|null;vehicles:Vehicle[];suppliers:Supplier[];vehicleId?: string | undefined}){
  const save=useSavePartInstallation();const recordsQ=useMaintenanceRecords();
  const defaultVehicle=vehicleId??part?.fitments[0]?.vehicle_id??vehicles[0]?.id??"";
  const latest=part?.prices.slice().sort((a,b)=>b.observed_date.localeCompare(a.observed_date))[0];
  const [form,setForm]=useState<PartInstallationInput>({part_id:"",vehicle_id:defaultVehicle,supplier_id:null,maintenance_record_id:null,install_date:today(),odometer:null,quantity:1,unit_price:0,other_cost:0,notes:null});
  const [receipt,setReceipt]=useState<File|null>(null);

  useEffect(()=>{
    if(!open||!part)return;
    const v=vehicleId??part.fitments[0]?.vehicle_id??vehicles[0]?.id??"";
    const lp=part.prices.slice().sort((a,b)=>b.observed_date.localeCompare(a.observed_date))[0];
    setForm({part_id:part.id,vehicle_id:v,supplier_id:lp?.supplier_id??null,maintenance_record_id:null,install_date:today(),odometer:null,quantity:1,unit_price:lp?.price??0,other_cost:0,notes:null});
    setReceipt(null);
  },[open,part,vehicleId,vehicles]);

  const records=useMemo(()=> (recordsQ.data??[]).filter(r=>r.vehicle_id===form.vehicle_id),[recordsQ.data,form.vehicle_id]);
  if(!part)return null;
  const set=<K extends keyof PartInstallationInput>(k:K,v:PartInstallationInput[K])=>setForm(p=>({...p,[k]:v}));
  const total=form.quantity*form.unit_price+form.other_cost;

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader className="text-right"><DialogTitle>تسجيل تركيب / شراء قطعة</DialogTitle><DialogDescription>{part.name_ar} — إذا ربطتها بصيانة فلن ينشأ مصروف منفصل لتجنب تكرار التكلفة.</DialogDescription></DialogHeader>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();save.mutate({input:form,opts:{receipt}},{onSuccess:()=>{toast.success("تم تسجيل القطعة");onOpenChange(false);},onError:err=>toast.error(errorMessage(err))});}}>
      <Field label="السيارة"><select className={inputClass} value={form.vehicle_id} disabled={!!vehicleId} onChange={e=>set("vehicle_id",e.target.value)}>{vehicles.filter(v=>part.fitments.some(f=>f.vehicle_id===v.id)).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
      <Field label="تاريخ التركيب / الشراء"><input className={inputClass} type="date" value={form.install_date} onChange={e=>set("install_date",e.target.value)}/></Field>
      <Field label="قراءة العداد"><input className={inputClass} type="number" min="0" value={form.odometer??""} onChange={e=>set("odometer",e.target.value?Number(e.target.value):null)}/></Field>
      <Field label="المورد"><select className={inputClass} value={form.supplier_id??""} onChange={e=>set("supplier_id",e.target.value||null)}><option value="">غير محدد</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <Field label="الكمية"><input className={inputClass} type="number" min="0.01" step="0.01" value={form.quantity} onChange={e=>set("quantity",Number(e.target.value))}/></Field>
      <Field label="سعر الوحدة"><input className={inputClass} type="number" min="0" step="0.01" value={form.unit_price} onChange={e=>set("unit_price",Number(e.target.value))}/></Field>
      <Field label="تكلفة إضافية"><input className={inputClass} type="number" min="0" step="0.01" value={form.other_cost} onChange={e=>set("other_cost",Number(e.target.value))}/></Field>
      <Field label="ربط بسجل صيانة">
        <select className={inputClass} value={form.maintenance_record_id??""} onChange={e=>set("maintenance_record_id",e.target.value||null)}>
          <option value="">بدون ربط — ينشأ مصروف قطعة مستقل</option>
          {records.map(r=><option key={r.id} value={r.id}>{r.item?.name_ar??"صيانة"} — {r.service_date}</option>)}
        </select>
      </Field>
      <div className="rounded-xl bg-secondary p-3 sm:col-span-2"><p className="text-xs text-ink-soft">إجمالي تكلفة القطعة</p><p className="num mt-1 text-xl font-semibold">{total.toLocaleString("en-US")} ر.س</p>{form.maintenance_record_id?<p className="mt-1 text-xs text-ink-soft">لن يُنشأ مصروف منفصل لأن العملية مرتبطة بصيانة.</p>:null}</div>
      <div className="sm:col-span-2"><Field label="ملاحظات"><textarea className={inputClass} value={form.notes??""} onChange={e=>set("notes",e.target.value||null)}/></Field></div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">فاتورة / إيصال</label>
        <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm"><span className="flex min-w-0 items-center gap-2 text-ink-soft"><Paperclip className="size-4"/><span className="truncate">{receipt?.name??"PDF أو صورة، بحد أقصى 10 MB"}</span></span><input className="sr-only" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={e=>setReceipt(e.target.files?.[0]??null)}/><span className={secondaryBtn}>اختيار ملف</span></label>
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={secondaryBtn} onClick={()=>onOpenChange(false)}>إلغاء</button><button className={primaryBtn} disabled={save.isPending||!form.vehicle_id}><Save className="size-4"/>{save.isPending?"جارٍ الحفظ...":"تسجيل"}</button></div>
    </form>
  </DialogContent></Dialog>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-medium">{label}{children}</label>;}
