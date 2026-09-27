import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import { useSavePartPrice } from "../hooks/useParts";
import type { Part, PartPriceInput, Supplier } from "../services/parts.service";

const inputClass="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const today=()=>new Date().toLocaleDateString("en-CA");

export function PartPriceForm({open,onOpenChange,part,suppliers}:{open:boolean;onOpenChange:(v:boolean)=>void;part:Part|null;suppliers:Supplier[]}){
  const save=useSavePartPrice();
  const [form,setForm]=useState<PartPriceInput>({part_id:"",supplier_id:null,price:0,observed_date:today(),purchase_url:null,notes:null});
  useEffect(()=>{
    if(!open||!part)return;
    setForm({part_id:part.id,supplier_id:null,price:0,observed_date:today(),purchase_url:null,notes:null});
  },[open,part]);
  if(!part)return null;
  const set=<K extends keyof PartPriceInput>(k:K,v:PartPriceInput[K])=>setForm(p=>({...p,[k]:v}));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="sm:max-w-lg">
    <DialogHeader className="text-right"><DialogTitle>إضافة سعر</DialogTitle><DialogDescription>{part.name_ar} — سجّل سعرًا من مورد أو متجر للرجوع إليه لاحقًا.</DialogDescription></DialogHeader>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();save.mutate({input:form},{onSuccess:()=>{toast.success("تم حفظ السعر");onOpenChange(false);},onError:err=>toast.error(errorMessage(err))});}}>
      <Field label="السعر"><input className={inputClass} type="number" min="0.01" step="0.01" value={form.price} onChange={e=>set("price",Number(e.target.value))}/></Field>
      <Field label="التاريخ"><input className={inputClass} type="date" value={form.observed_date} onChange={e=>set("observed_date",e.target.value)}/></Field>
      <Field label="المورد">
        <select className={inputClass} value={form.supplier_id??""} onChange={e=>set("supplier_id",e.target.value||null)}>
          <option value="">غير محدد</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="رابط الشراء"><input dir="ltr" className={inputClass} value={form.purchase_url??""} onChange={e=>set("purchase_url",e.target.value||null)} /></Field>
      <div className="sm:col-span-2"><Field label="ملاحظات"><textarea className={inputClass} value={form.notes??""} onChange={e=>set("notes",e.target.value||null)} /></Field></div>
      <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={secondaryBtn} onClick={()=>onOpenChange(false)}>إلغاء</button><button className={primaryBtn} disabled={save.isPending||form.price<=0}><Save className="size-4"/>حفظ السعر</button></div>
    </form>
  </DialogContent></Dialog>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-medium">{label}{children}</label>;}
