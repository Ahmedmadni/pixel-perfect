import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteReminder, getReminders, saveReminder, setReminderStatus, type ReminderInput, type ReminderStatus } from "../services/reminders.service";

export const reminderKeys={root:["reminders"] as const,list:(vehicleId?:string)=>["reminders","list",vehicleId??"all"] as const};

export function useReminders(vehicleId?:string){
  return useQuery({queryKey:reminderKeys.list(vehicleId),queryFn:()=>getReminders(vehicleId),retry:false});
}
function invalidate(qc:ReturnType<typeof useQueryClient>){qc.invalidateQueries({queryKey:reminderKeys.root});}
export function useSaveReminder(){const qc=useQueryClient();return useMutation({mutationFn:(args:{input:ReminderInput;id?:string})=>saveReminder(args.input,args.id),onSuccess:()=>invalidate(qc)});}
export function useSetReminderStatus(){const qc=useQueryClient();return useMutation({mutationFn:(args:{id:string;status:ReminderStatus})=>setReminderStatus(args.id,args.status),onSuccess:()=>invalidate(qc)});}
export function useDeleteReminder(){const qc=useQueryClient();return useMutation({mutationFn:deleteReminder,onSuccess:()=>invalidate(qc)});}
