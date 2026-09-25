import { requireClient, requireUserId, toDataError } from "@/lib/data-provider";
import type { Vehicle, VehicleInput } from "@/types/vehicle";

export async function getVehicles(): Promise<Vehicle[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw toDataError(error);
  return (data ?? []) as Vehicle[];
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const client = requireClient();
  const { data, error } = await client.from("vehicles").select("*").eq("id", id).single();
  if (error) throw toDataError(error);
  return data as Vehicle;
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const client = requireClient();
  const user_id = await requireUserId(client);
  const { data, error } = await client
    .from("vehicles")
    .insert({ ...input, user_id })
    .select("*")
    .single();
  if (error) throw toDataError(error);
  return data as Vehicle;
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle> {
  const client = requireClient();
  const { data, error } = await client
    .from("vehicles")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw toDataError(error);
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from("vehicles").delete().eq("id", id);
  if (error) throw toDataError(error);
}
