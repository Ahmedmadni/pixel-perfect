import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export const VEHICLE_DOCUMENT_BUCKET = "vehicle-documents";
const FILE_TYPES=["image/jpeg","image/png","image/webp","application/pdf"];
const FILE_MAX=15*1024*1024;

export type VehicleDocumentType="registration"|"insurance"|"inspection"|"ownership"|"warranty"|"invoice"|"other";

export interface VehicleDocument {
  id:string;
  vehicle_id:string;
  document_type:VehicleDocumentType;
  title:string;
  document_date:string|null;
  expiry_date:string|null;
  remind_days_before:number;
  issuer:string|null;
  reference_number:string|null;
  file_url:string|null;
  notes:string|null;
  created_at:string;
  vehicle?:{name:string}|null;
}
export interface VehicleDocumentInput {
  vehicle_id:string;
  document_type:VehicleDocumentType;
  title:string;
  document_date:string|null;
  expiry_date:string|null;
  remind_days_before:number;
  issuer:string|null;
  reference_number:string|null;
  notes:string|null;
}

export async function getVehicleDocuments(vehicleId?:string):Promise<VehicleDocument[]>{
  const c=requireClient();
  let q=c.from("vehicle_documents").select("*, vehicle:vehicles(name)").order("expiry_date",{ascending:true,nullsFirst:false}).order("created_at",{ascending:false});
  if(vehicleId)q=q.eq("vehicle_id",vehicleId);
  const {data,error}=await q;if(error)throw toDataError(error);return (data??[]) as unknown as VehicleDocument[];
}
export function validateVehicleDocument(input:VehicleDocumentInput):string|null{
  if(!input.vehicle_id)return "اختر السيارة.";
  if(!input.title.trim())return "عنوان المستند مطلوب.";
  if(input.remind_days_before<0||input.remind_days_before>3650)return "مدة التذكير غير صحيحة.";
  if(input.document_date&&input.expiry_date&&input.expiry_date<input.document_date)return "تاريخ الانتهاء لا يمكن أن يسبق تاريخ المستند.";
  return null;
}
function validateFile(file:File):string|null{
  if(!FILE_TYPES.includes(file.type))return "الصيغ المسموحة: JPG/PNG/WEBP أو PDF.";
  if(file.size>FILE_MAX)return "حجم الملف يجب ألا يتجاوز 15 ميجابايت.";
  return null;
}
export async function saveVehicleDocument(input:VehicleDocumentInput,opts:{id?: string | undefined;file?: File | null | undefined;removeFile?: boolean | undefined;oldFile?:string|null}){
  const bad=validateVehicleDocument(input);if(bad)throw new DataProviderError("VALIDATION_ERROR",bad);
  if(opts.file){const fileError=validateFile(opts.file);if(fileError)throw new DataProviderError("VALIDATION_ERROR",fileError);}
  const c=requireClient();const user_id=await requireUserId(c);let id=opts.id;
  if(id){
    const {data,error}=await c.from("vehicle_documents").update(input).eq("id",id).select("id").maybeSingle();
    if(error)throw toDataError(error);if(!data)throw new DataProviderError("NOT_FOUND");
  }else{
    const {data,error}=await c.from("vehicle_documents").insert({...input,user_id}).select("id").single();
    if(error)throw toDataError(error);id=data.id as string;
  }
  if(opts.file){
    const ext=opts.file.name.split(".").pop()?.toLowerCase()||"bin";
    const path=[user_id,input.vehicle_id,id,String(Date.now())+"."+ext].join("/");
    const up=await c.storage.from(VEHICLE_DOCUMENT_BUCKET).upload(path,opts.file,{contentType:opts.file.type});
    if(up.error)throw new DataProviderError("UNKNOWN","تم حفظ المستند لكن تعذّر رفع الملف.");
    const linked=await c.from("vehicle_documents").update({file_url:path}).eq("id",id).select("id").maybeSingle();
    if(linked.error||!linked.data){await c.storage.from(VEHICLE_DOCUMENT_BUCKET).remove([path]);if(linked.error)throw toDataError(linked.error);throw new DataProviderError("NOT_FOUND");}
    if(opts.oldFile)await c.storage.from(VEHICLE_DOCUMENT_BUCKET).remove([opts.oldFile]);
  }else if(opts.removeFile&&opts.oldFile){
    const cleared=await c.from("vehicle_documents").update({file_url:null}).eq("id",id).select("id").maybeSingle();
    if(cleared.error)throw toDataError(cleared.error);if(!cleared.data)throw new DataProviderError("NOT_FOUND");
    await c.storage.from(VEHICLE_DOCUMENT_BUCKET).remove([opts.oldFile]);
  }
  return id;
}
export async function deleteVehicleDocument(doc:Pick<VehicleDocument,"id"|"file_url">){
  const c=requireClient();const {data,error}=await c.from("vehicle_documents").delete().eq("id",doc.id).select("id");
  if(error)throw toDataError(error);if(!data?.length)throw new DataProviderError("NOT_FOUND");
  if(doc.file_url)await c.storage.from(VEHICLE_DOCUMENT_BUCKET).remove([doc.file_url]);
}
export async function getVehicleDocumentUrl(path:string){
  const c=requireClient();const {data,error}=await c.storage.from(VEHICLE_DOCUMENT_BUCKET).createSignedUrl(path,300);
  if(error)throw toDataError(error);return data.signedUrl;
}
