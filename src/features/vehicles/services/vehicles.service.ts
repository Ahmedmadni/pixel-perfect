import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";
import type { Vehicle, VehicleInput } from "@/types/vehicle";

const BUCKET = "vehicle-images";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** image_url and is_active are managed by dedicated functions only. */
function stripManaged(input: Partial<VehicleInput>) {
  const { image_url: _i, is_active: _a, ...rest } = input;
  return rest;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("vehicles")
    .select("*")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw toDataError(error);
  return (data ?? []) as Vehicle[];
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const client = requireClient();
  const { data, error } = await client.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (error) throw toDataError(error);
  if (!data) throw new DataProviderError("NOT_FOUND");
  return data as Vehicle;
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const client = requireClient();
  const user_id = await requireUserId(client);
  const { data, error } = await client
    .from("vehicles")
    .insert({ ...stripManaged(input), user_id } as never)
    .select("*")
    .single();
  if (error) throw toDataError(error);
  return data as Vehicle;
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle> {
  const client = requireClient();
  const { data, error } = await client
    .from("vehicles")
    .update(stripManaged(input))
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw toDataError(error);
  if (!data) throw new DataProviderError("NOT_FOUND");
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const client = requireClient();
  const { data: v } = await client.from("vehicles").select("image_url").eq("id", id).maybeSingle();
  const { data, error } = await client.from("vehicles").delete().eq("id", id).select("id");
  if (error) throw toDataError(error);
  if (!data?.length) throw new DataProviderError("NOT_FOUND");
  if (v?.image_url) await client.storage.from(BUCKET).remove([v.image_url]);
}

export async function setActiveVehicle(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.rpc("set_active_vehicle", { _vehicle_id: id });
  if (error) throw toDataError(error);
}

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "الصيغ المسموحة: JPG أو PNG أو WEBP فقط.";
  if (file.size > MAX_BYTES) return "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.";
  return null;
}

export async function uploadVehicleImage(vehicle: Vehicle, file: File): Promise<Vehicle> {
  const invalid = validateImage(file);
  if (invalid) throw new DataProviderError("VALIDATION_ERROR", invalid);
  const client = requireClient();
  const user_id = await requireUserId(client);
  const ext = file.type.split("/")[1];
  const path = `${user_id}/${vehicle.id}/${Date.now()}.${ext}`;
  const up = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (up.error) throw new DataProviderError("VALIDATION_ERROR", "تعذّر رفع الصورة. حاول مرة أخرى.");
  const { data, error } = await client.from("vehicles").update({ image_url: path }).eq("id", vehicle.id).select("*").single();
  if (error) {
    await client.storage.from(BUCKET).remove([path]);
    throw toDataError(error);
  }
  if (vehicle.image_url && !vehicle.image_url.startsWith("http")) await client.storage.from(BUCKET).remove([vehicle.image_url]);
  return data as Vehicle;
}

export async function removeVehicleImage(vehicle: Vehicle): Promise<Vehicle> {
  const client = requireClient();
  const { data, error } = await client.from("vehicles").update({ image_url: null }).eq("id", vehicle.id).select("*").single();
  if (error) throw toDataError(error);
  if (vehicle.image_url && !vehicle.image_url.startsWith("http")) await client.storage.from(BUCKET).remove([vehicle.image_url]);
  return data as Vehicle;
}

export async function getVehicleImageUrl(path: string): Promise<string | null> {
  if (path.startsWith("http")) return path;
  const client = requireClient();
  const { data } = await client.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
