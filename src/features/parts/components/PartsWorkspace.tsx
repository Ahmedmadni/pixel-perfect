import { useMemo, useState } from "react";
import {
  ExternalLink, Image as ImageIcon, PackageSearch, Pencil, Plus, Search, Store, Trash2, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import { CardsSkeleton, EmptyState, QueryErrorState, StatusBadge } from "@/components/common/states";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { errorMessage } from "@/lib/data-provider";
import { formatCurrency, formatDate, formatKm } from "@/lib/format";
import {
  useDeletePart, useDeletePartInstallation, useParts, usePartInstallations, useSuppliers,
} from "../hooks/useParts";
import { latestPartPrice, PART_STATUS_LABELS, summarizeParts } from "../lib/analytics";
import { getPartDocumentUrl, type Part, type PartInstallation, type PartStatus } from "../services/parts.service";
import { PartForm } from "./PartForm";
import { PartInstallationForm } from "./PartInstallationForm";
import { PartPriceForm } from "./PartPriceForm";
import { SupplierManager } from "./SupplierManager";

const tones:Record<PartStatus,"neutral"|"brand"|"warning"|"success">={
  researching:"neutral",found:"brand",purchased:"warning",installed:"success",archived:"neutral",
};

export function PartsWorkspace({vehicleId}:{vehicleId?:string}){
  const vehiclesQ=useVehicles();
  const partsQ=useParts(vehicleId);
  const suppliersQ=useSuppliers();
  const installationsQ=usePartInstallations(vehicleId);
  const deletePart=useDeletePart();
  const deleteInstallation=useDeletePartInstallation();

  const [query,setQuery]=useState("");
  const [status,setStatus]=useState<"all"|PartStatus>("all");
  const [vehicleFilter,setVehicleFilter]=useState(vehicleId??"all");
  const [partFormOpen,setPartFormOpen]=useState(false);
  const [priceOpen,setPriceOpen]=useState(false);
  const [installOpen,setInstallOpen]=useState(false);
  const [suppliersOpen,setSuppliersOpen]=useState(false);
  const [selectedPart,setSelectedPart]=useState<Part|null>(null);

  const loading=vehiclesQ.isPending||partsQ.isPending||suppliersQ.isPending||installationsQ.isPending;
  const error=vehiclesQ.error??partsQ.error??suppliersQ.error??installationsQ.error;
  const parts=partsQ.data??[];
  const summary=useMemo(()=>summarizeParts(parts),[parts]);
  const vehicleMap=useMemo(()=>new Map((vehiclesQ.data??[]).map(v=>[v.id,v.name])),[vehiclesQ.data]);

  const filtered=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return parts.filter(part=>{
      if(status!=="all"&&part.status!==status)return false;
      if(vehicleFilter!=="all"&&!part.fitments.some(f=>f.vehicle_id===vehicleFilter))return false;
      if(!needle)return true;
      return [part.name_ar,part.name_en??"",part.part_number??"",part.oem_part_number??"",part.manufacturer??"",part.notes??""]
        .some(value=>value.toLowerCase().includes(needle));
    });
  },[parts,status,vehicleFilter,query]);

  const openDocument=async(path:string)=>{
    const tab=window.open("about:blank","_blank");if(tab)tab.opener=null;
    try{const url=await getPartDocumentUrl(path);if(tab)tab.location.href=url;else window.location.assign(url);}
    catch(e){tab?.close();toast.error(errorMessage(e));}
  };

  if(loading)return <CardsSkeleton count={6}/>;
  if(error)return <QueryErrorState error={error} onRetry={()=>{vehiclesQ.refetch();partsQ.refetch();suppliersQ.refetch();installationsQ.refetch();}}/>;
  if(!(vehiclesQ.data??[]).length)return <EmptyState title="لا توجد سيارة" description="أضف سيارة أولًا ثم ابدأ حفظ قطع الغيار الخاصة بها."/>;

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Summary label="إجمالي القطع" value={summary.total}/>
      <Summary label="قيد البحث" value={summary.researching}/>
      <Summary label="تم شراؤها" value={summary.purchased}/>
      <Summary label="تم تركيبها" value={summary.installed}/>
    </div>

    <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
      <div className="flex flex-col gap-2 xl:flex-row">
        <label className="relative min-w-0 flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"/><input className="w-full rounded-xl border border-border bg-background py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-brand/30" placeholder="ابحث باسم القطعة أو رقمها أو الشركة..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
        {!vehicleId?<select className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" value={vehicleFilter} onChange={e=>setVehicleFilter(e.target.value)}><option value="all">كل السيارات</option>{(vehiclesQ.data??[]).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>:null}
        <select className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" value={status} onChange={e=>setStatus(e.target.value as "all"|PartStatus)}>
          <option value="all">كل الحالات</option>{(Object.keys(PART_STATUS_LABELS) as PartStatus[]).map(s=><option key={s} value={s}>{PART_STATUS_LABELS[s]}</option>)}
        </select>
        <button className={secondaryBtn} onClick={()=>setSuppliersOpen(true)}><Store className="size-4"/> الموردون</button>
        <button className={primaryBtn} onClick={()=>{setSelectedPart(null);setPartFormOpen(true);}}><Plus className="size-4"/> إضافة قطعة</button>
      </div>
    </div>

    {filtered.length?<div className="grid gap-4 lg:grid-cols-2">
      {filtered.map(part=>{
        const latest=latestPartPrice(part.prices);
        return <article key={part.id} className="rounded-2xl bg-panel p-4 ring-1 ring-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{part.name_ar}</h3><StatusBadge tone={tones[part.status]}>{PART_STATUS_LABELS[part.status]}</StatusBadge>{part.is_oem?<StatusBadge tone="brand">OEM</StatusBadge>:null}</div>
              {part.name_en?<p className="mt-1 text-xs text-ink-soft" dir="ltr">{part.name_en}</p>:null}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                {part.part_number?<span dir="ltr">Part #: {part.part_number}</span>:null}
                {part.oem_part_number?<span dir="ltr">OEM #: {part.oem_part_number}</span>:null}
                {part.manufacturer?<span>{part.manufacturer}</span>:null}
              </div>
            </div>
            {latest?<div className="shrink-0 text-left"><p className="num font-semibold">{formatCurrency(latest.price)}</p><p className="text-[10px] text-ink-soft">{formatDate(latest.observed_date)}</p></div>:null}
          </div>

          <p className="mt-3 text-xs text-ink-soft">متوافقة مع: {part.fitments.map(f=>vehicleMap.get(f.vehicle_id)??"سيارة").join("، ")}</p>
          {part.notes?<p className="mt-2 text-sm">{part.notes}</p>:null}

          {part.prices.length?<div className="mt-3 rounded-xl bg-secondary/60 p-3">
            <p className="text-xs font-medium">آخر الأسعار</p>
            <div className="mt-2 space-y-1">{[...part.prices].sort((a,b)=>b.observed_date.localeCompare(a.observed_date)).slice(0,3).map(p=><div key={p.id} className="flex items-center justify-between gap-2 text-xs"><span>{p.supplier?.name??"مورد غير محدد"} · {formatDate(p.observed_date)}</span><span className="num font-medium">{formatCurrency(p.price)}</span></div>)}</div>
          </div>:null}

          <div className="mt-4 flex flex-wrap gap-2">
            {part.image_url?<button className={secondaryBtn} onClick={()=>openDocument(part.image_url!)}><ImageIcon className="size-4"/> الصورة</button>:null}
            <button className={secondaryBtn} onClick={()=>{setSelectedPart(part);setPriceOpen(true);}}><Plus className="size-4"/> سعر</button>
            <button className={secondaryBtn} onClick={()=>{setSelectedPart(part);setInstallOpen(true);}}><Wrench className="size-4"/> تركيب/شراء</button>
            <button className={secondaryBtn} onClick={()=>{setSelectedPart(part);setPartFormOpen(true);}}><Pencil className="size-4"/> تعديل</button>
            <ConfirmDialog title="حذف القطعة؟" description="سيتم حذف القطعة وسجل أسعارها وعمليات تركيبها المرتبطة. لا يمكن التراجع." confirmLabel="حذف"
              onConfirm={()=>deletePart.mutate(part,{onSuccess:()=>toast.success("تم حذف القطعة"),onError:e=>toast.error(errorMessage(e))})}
              trigger={<button className={secondaryBtn+" text-destructive"}><Trash2 className="size-4"/> حذف</button>}/>
          </div>
        </article>;
      })}
    </div>:<EmptyState icon={PackageSearch} title="لا توجد قطع مطابقة" description="غيّر الفلاتر أو أضف أول قطعة إلى الكتالوج." action={<button className={primaryBtn} onClick={()=>{setSelectedPart(null);setPartFormOpen(true);}}><Plus className="size-4"/> إضافة قطعة</button>}/>}

    <section>
      <h3 className="mb-3 text-sm font-semibold">سجل التركيب والشراء</h3>
      {(installationsQ.data??[]).length?<div className="space-y-2">{(installationsQ.data??[]).slice(0,20).map((ins:PartInstallation)=><div key={ins.id} className="rounded-xl bg-panel p-3 ring-1 ring-border">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{ins.part?.name_ar??"قطعة"}</p><p className="mt-1 text-xs text-ink-soft">{ins.vehicle?.name??vehicleMap.get(ins.vehicle_id)} · {formatDate(ins.install_date)}{ins.odometer!=null?" · "+formatKm(ins.odometer):""}</p></div><p className="num font-semibold">{formatCurrency(ins.total_cost)}</p></div>
        <div className="mt-2 flex flex-wrap gap-2">{ins.maintenance_record_id?<StatusBadge tone="brand">ضمن صيانة</StatusBadge>:<StatusBadge tone="success">مصروف قطعة مستقل</StatusBadge>}{ins.supplier?.name?<StatusBadge>{ins.supplier.name}</StatusBadge>:null}{ins.receipt_url?<button className={secondaryBtn} onClick={()=>openDocument(ins.receipt_url!)}><ExternalLink className="size-4"/> المرفق</button>:null}
          <ConfirmDialog title="حذف سجل التركيب؟" description="سيُحذف سجل التركيب، وإذا كان له مصروف قطعة مستقل فسيُحذف تلقائيًا أيضًا." confirmLabel="حذف" onConfirm={()=>deleteInstallation.mutate(ins,{onSuccess:()=>toast.success("تم حذف سجل التركيب"),onError:e=>toast.error(errorMessage(e))})} trigger={<button className={secondaryBtn+" text-destructive"}><Trash2 className="size-4"/></button>}/>
        </div>
      </div>)}</div>:<p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-ink-soft">لا توجد عمليات تركيب أو شراء مسجلة بعد.</p>}
    </section>

    <PartForm open={partFormOpen} onOpenChange={v=>{setPartFormOpen(v);if(!v)setSelectedPart(null);}} vehicles={vehiclesQ.data??[]} vehicleId={vehicleId} part={selectedPart}/>
    <PartPriceForm open={priceOpen} onOpenChange={v=>{setPriceOpen(v);if(!v)setSelectedPart(null);}} part={selectedPart} suppliers={suppliersQ.data??[]}/>
    <PartInstallationForm open={installOpen} onOpenChange={v=>{setInstallOpen(v);if(!v)setSelectedPart(null);}} part={selectedPart} vehicles={vehiclesQ.data??[]} suppliers={suppliersQ.data??[]} vehicleId={vehicleId}/>
    <SupplierManager open={suppliersOpen} onOpenChange={setSuppliersOpen} suppliers={suppliersQ.data??[]}/>
  </div>;
}

function Summary({label,value}:{label:string;value:number}){return <div className="rounded-2xl bg-panel p-4 ring-1 ring-border"><p className="text-xs text-ink-soft">{label}</p><p className="num mt-2 text-2xl font-semibold">{value}</p></div>;}
