import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteVehicleDocument, getVehicleDocuments, saveVehicleDocument, type VehicleDocument, type VehicleDocumentInput } from "../services/documents.service";

export const documentKeys={root:["vehicle-documents"] as const,list:(vehicleId?:string)=>["vehicle-documents","list",vehicleId??"all"] as const};
export function useVehicleDocuments(vehicleId?:string){return useQuery({queryKey:documentKeys.list(vehicleId),queryFn:()=>getVehicleDocuments(vehicleId),retry:false});}
function invalidate(qc:ReturnType<typeof useQueryClient>){qc.invalidateQueries({queryKey:documentKeys.root});qc.invalidateQueries({queryKey:["reminders"]});}
export function useSaveVehicleDocument(){const qc=useQueryClient();return useMutation({mutationFn:(args:{input:VehicleDocumentInput;opts:{id?:string;file?:File|null;removeFile?:boolean;oldFile?:string|null}})=>saveVehicleDocument(args.input,args.opts),onSuccess:()=>invalidate(qc)});}
export function useDeleteVehicleDocument(){const qc=useQueryClient();return useMutation({mutationFn:(doc:Pick<VehicleDocument,"id"|"file_url">)=>deleteVehicleDocument(doc),onSuccess:()=>invalidate(qc)});}
