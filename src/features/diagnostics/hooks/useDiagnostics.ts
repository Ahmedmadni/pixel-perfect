import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteDiagnosticEvent,
  deleteDiagnosticIssue,
  getDiagnosticIssues,
  saveDiagnosticEvent,
  saveDiagnosticIssue,
  type DiagnosticEventInput,
  type DiagnosticIssue,
  type DiagnosticIssueInput,
} from "../services/diagnostics.service";

export const diagnosticKeys = {
  root: ["diagnostics"] as const,
  list: (vehicleId?: string) => ["diagnostics","list",vehicleId??"all"] as const,
};

export function useDiagnosticIssues(vehicleId?: string) {
  return useQuery({queryKey:diagnosticKeys.list(vehicleId),queryFn:()=>getDiagnosticIssues(vehicleId),retry:false});
}
function invalidate(qc:ReturnType<typeof useQueryClient>){qc.invalidateQueries({queryKey:diagnosticKeys.root});}
export function useSaveDiagnosticIssue(){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:(args:{input:DiagnosticIssueInput;opts:{id?: string | undefined;attachment?: File | null | undefined;removeAttachment?: boolean | undefined;oldAttachment?:string|null}})=>saveDiagnosticIssue(args.input,args.opts),
    onSuccess:()=>invalidate(qc),
  });
}
export function useDeleteDiagnosticIssue(){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:(issue:Pick<DiagnosticIssue,"id"|"attachment_url">)=>deleteDiagnosticIssue(issue),
    onSuccess:()=>invalidate(qc),
  });
}
export function useSaveDiagnosticEvent(){
  const qc=useQueryClient();
  return useMutation({mutationFn:(input:DiagnosticEventInput)=>saveDiagnosticEvent(input),onSuccess:()=>invalidate(qc)});
}
export function useDeleteDiagnosticEvent(){
  const qc=useQueryClient();
  return useMutation({mutationFn:deleteDiagnosticEvent,onSuccess:()=>invalidate(qc)});
}
