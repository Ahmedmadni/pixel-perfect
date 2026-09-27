import { useEffect, useState } from "react";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import { useSavePart } from "../hooks/useParts";
import { PART_STATUS_LABELS } from "../lib/analytics";
import type { Part, PartInput, PartStatus } from "../services/parts.service";

const inputClass="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30";

export function PartForm({
  open,onOpenChange,vehicles,vehicleId,part,
}:{
  open:boolean;
  onOpenChange:(open:boolean)=>void;
  vehicles:Vehicle[];
  vehicleId?:string;
  part?:Part|null;
}){
  const save=useSavePart();
  const [form,setForm]=useState<PartInput>({
    name_ar:"",name_en:null,part_number:null,oem_part_number:null,manufacturer:null,
    is_oem:false,status:"researching",notes:null,vehicle_ids:vehicleId?[vehicleId]:[],
  });
  const [image,setImage]=useState<File|null>(null);
  const [removeImage,setRemoveImage]=useState(false);

  useEffect(()=>{
    if(!open)return;
    setForm({
      name_ar:part?.name_ar??"",
      name_en:part?.name_en??null,
      part_number:part?.part_number??null,
      oem_part_number:part?.oem_part_number??null,
      manufacturer:part?.manufacturer??null,
      is_oem:part?.is_oem??false,
      status:part?.status??"researching",
      notes:part?.notes??null,
      vehicle_ids:vehicleId?[vehicleId]:(part?.fitments.map(f=>f.vehicle_id)??[]),
    });
    setImage(null);
    setRemoveImage(false);
  },[open,part,vehicleId]);

  const set=<K extends keyof PartInput>(key:K,value:PartInput[K])=>setForm(prev=>({...prev,[key]:value}));
  const toggleVehicle=(id:string)=>set("vehicle_ids",form.vehicle_ids.includes(id)?form.vehicle_ids.filter(v=>v!==id):[...form.vehicle_ids,id]);

  function submit(event:React.FormEvent){
    event.preventDefault();
    save.mutate({
      input:form,
      opts:{id:part?.id,image,removeImage,oldImage:part?.image_url??null},
    },{
      onSuccess:()=>{toast.success(part?"تم تحديث القطعة":"تمت إضافة القطعة");onOpenChange(false);},
      onError:e=>toast.error(errorMessage(e)),
    });
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader className="text-right">
        <DialogTitle>{part?"تعديل قطعة":"إضافة قطعة غيار"}</DialogTitle>
        <DialogDescription>احفظ رقم القطعة والشركة والحالة والسيارات المتوافقة للرجوع إليها بسرعة.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم القطعة بالعربية">
          <input className={inputClass} value={form.name_ar} onChange={e=>set("name_ar",e.target.value)} />
        </Field>
        <Field label="الاسم الإنجليزي">
          <input className={inputClass} value={form.name_en??""} onChange={e=>set("name_en",e.target.value||null)} />
        </Field>
        <Field label="رقم القطعة">
          <input dir="ltr" className={inputClass} value={form.part_number??""} onChange={e=>set("part_number",e.target.value||null)} />
        </Field>
        <Field label="رقم OEM">
          <input dir="ltr" className={inputClass} value={form.oem_part_number??""} onChange={e=>set("oem_part_number",e.target.value||null)} />
        </Field>
        <Field label="الشركة المصنعة">
          <input className={inputClass} value={form.manufacturer??""} onChange={e=>set("manufacturer",e.target.value||null)} />
        </Field>
        <Field label="الحالة">
          <select className={inputClass} value={form.status} onChange={e=>set("status",e.target.value as PartStatus)}>
            {(Object.keys(PART_STATUS_LABELS) as PartStatus[]).map(status=><option key={status} value={status}>{PART_STATUS_LABELS[status]}</option>)}
          </select>
        </Field>

        <label className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.is_oem} onChange={e=>set("is_oem",e.target.checked)} />
          قطعة أصلية OEM
        </label>

        <div className="sm:col-span-2">
          <p className="text-sm font-medium">السيارات المتوافقة</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {vehicles.map(vehicle=><label key={vehicle.id} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
              <input type="checkbox" checked={form.vehicle_ids.includes(vehicle.id)} disabled={!!vehicleId} onChange={()=>toggleVehicle(vehicle.id)} />
              <span>{vehicle.name}</span>
            </label>)}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">صورة القطعة</label>
          <label className="mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border p-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink-soft"><ImagePlus className="size-4"/><span className="truncate">{image?.name??(part?.image_url?"استبدال الصورة الحالية":"JPG أو PNG أو WEBP، بحد أقصى 10 MB")}</span></span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImage(e.target.files?.[0]??null)} />
            <span className={secondaryBtn}>اختيار صورة</span>
          </label>
          {part?.image_url?<label className="mt-2 flex items-center gap-2 text-xs text-ink-soft"><input type="checkbox" checked={removeImage} onChange={e=>setRemoveImage(e.target.checked)}/> حذف الصورة الحالية</label>:null}
        </div>

        <div className="sm:col-span-2">
          <Field label="ملاحظات">
            <textarea className={inputClass+" min-h-24"} value={form.notes??""} onChange={e=>set("notes",e.target.value||null)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className={secondaryBtn} onClick={()=>onOpenChange(false)}>إلغاء</button>
          <button type="submit" className={primaryBtn} disabled={save.isPending||!form.name_ar.trim()||!form.vehicle_ids.length}>
            <Save className="size-4"/>{save.isPending?"جارٍ الحفظ...":"حفظ"}
          </button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-sm font-medium">{label}{children}</label>;}
