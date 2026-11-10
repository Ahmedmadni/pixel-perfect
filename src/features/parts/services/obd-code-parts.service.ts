import { requireClient, requireUserId, toDataError } from "@/lib/data-provider";

export interface ObdCodePartLink { id: string; code: string; part_id: string }

export async function getObdCodePartLinks(): Promise<ObdCodePartLink[]> {
  const c = requireClient();
  const { data, error } = await c.from("obd_code_parts").select("id,code,part_id");
  if (error) throw toDataError(error);
  return (data ?? []) as ObdCodePartLink[];
}

export async function linkPartToCode(code: string, partId: string) {
  const c = requireClient();
  const user_id = await requireUserId(c);
  const { error } = await c.from("obd_code_parts").upsert({ user_id, code, part_id: partId }, { onConflict: "user_id,code,part_id", ignoreDuplicates: true });
  if (error) throw toDataError(error);
}

export async function unlinkPartFromCode(id: string) {
  const c = requireClient();
  const { error } = await c.from("obd_code_parts").delete().eq("id", id);
  if (error) throw toDataError(error);
}
