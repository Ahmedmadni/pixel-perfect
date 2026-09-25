import { requireClient, requireUserId, toDataError } from "@/lib/data-provider";
import type { Profile } from "@/types/vehicle";

export type ProfileUpdate = Partial<Pick<Profile, "full_name" | "phone" | "preferred_language">>;

export async function getProfile(): Promise<Profile> {
  const client = requireClient();
  const id = await requireUserId(client);
  const { data, error } = await client.from("profiles").select("*").eq("id", id).single();
  if (error) throw toDataError(error);
  return data as Profile;
}

export async function updateProfile(update: ProfileUpdate): Promise<Profile> {
  const client = requireClient();
  const id = await requireUserId(client);
  const { data, error } = await client
    .from("profiles")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toDataError(error);
  return data as Profile;
}
