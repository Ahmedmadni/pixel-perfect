import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { errorMessage } from "@/lib/data-provider";
import { useDeleteSupplier, useSaveSupplier } from "../hooks/useParts";
import type { Supplier } from "../services/parts.service";

const empty={name:"",phone:null,website:null,address:null,notes:null};
const inputClass="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function SupplierManager({open,onOpenChange,suppliers}:{open:boolean;onOpenChange:(v:boolean)=>void;suppliers:Supplier[]}){
  const save=useSaveSupplier();const del=useDeleteSupplier();
  const [form,setForm]=useState<Omit<Supplier,"id">>(empty);const [editing,setEditing]=useState<string|undefined>();
  const select=(s:Supplier)=>{setEditing(s.id);setForm({name:s.name,phone:s.phone,website:s.website,address:s.address,notes:s.notes});};
  const reset=()=>{setEditing(undefined);setForm(empty);};
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader className="text-right"><DialogTitle>الموردون والمتاجر</DialogTitle><DialogDescription>احفظ بيانات المورد مرة واحدة ثم استخدمه في سجل الأسعار وعمليات التركيب.</DialogDescription></DialogHeader>
    <form className="grid gap-3 rounded-2xl bg-secondary/50 p-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();save.mutate({input:form,id:editing},{onSuccess:()=>{toast.success(editing?"تم تحديث المورد":"تمت إضافة المورد");reset();},onError:err=>toast.error(errorMessage(err))});}}>
      <input className={inputClass} placeholder="اسم المورد *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
      <input className={inputClass} placeholder="الهاتف" value={form.phone??""} onChange={e=>setForm(p=>({...p,phone:e.target.value||null}))}/>
      <input dir="ltr" className={inputClass} placeholder="https://..." value={form.website??""} onChange={e=>setForm(p=>({...p,website:e.target.value||null}))}/>
      <input className={inputClass} placeholder="العنوان" value={form.address??""} onChange={e=>setForm(p=>({...p,address:e.target.value||null}))}/>
      <input className={inputClass+" sm:col-span-2"} placeholder="ملاحظات" value={form.notes??""} onChange={e=>setForm(p=>({...p,notes:e.target.value||null}))}/>
      <div className="flex gap-2 sm:col-span-2">
        <button className={primaryBtn} disabled={save.isPending||!form.name.trim()}><Save className="size-4"/>{editing?"تحديث":"إضافة"}</button>
        {editing?<button type="button" className={secondaryBtn} onClick={reset}>إلغاء التعديل</button>:null}
      </div>
    </form>

    <div className="space-y-2">
      {suppliers.length?suppliers.map(s=><div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
        <button type="button" className="min-w-0 flex-1 text-right" onClick={()=>select(s)}>
          <p className="font-medium">{s.name}</p><p className="mt-1 text-xs text-ink-soft">{[s.phone,s.website,s.address].filter(Boolean).join(" · ")||"لا توجد بيانات إضافية"}</p>
        </button>
        <ConfirmDialog title="حذف المورد؟" description="سيبقى سجل القطع والأسعار، لكن سيتم إزالة ربط المورد من السجلات المرتبطة." confirmLabel="حذف"
          onConfirm={()=>del.mutate(s.id,{onSuccess:()=>toast.success("تم حذف المورد"),onError:e=>toast.error(errorMessage(e))})}
          trigger={<button className={secondaryBtn+" text-destructive"}><Trash2 className="size-4"/></button>}/>
      </div>):<p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-ink-soft">لا يوجد موردون بعد.</p>}
    </div>
  </DialogContent></Dialog>;
}
