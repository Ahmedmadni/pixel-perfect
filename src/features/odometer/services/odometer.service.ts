import { DataProviderError, requireClient, requireUserId, toDataError } from "@/lib/data-provider";
import type { OdometerReading, OdometerReadingInput } from "@/types/vehicle";
import { evaluateReading, type OdometerEvaluation } from "../lib/odometer-rules";

export async function getOdometerReadings(vehicleId: string): Promise<OdometerReading[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("odometer_readings")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("reading_date", { ascending: false });
  if (error) throw toDataError(error);
  return (data ?? []) as OdometerReading[];
}

/**
 * Inserts a reading. The database trigger updates vehicles.current_odometer
 * only when the reading is greater than the current value.
 */
export async function createOdometerReading(
  input: OdometerReadingInput,
  currentOdometer: number,
): Promise<{ reading: OdometerReading; evaluation: OdometerEvaluation }> {
  const evaluation = evaluateReading(input.reading, currentOdometer);
  if (evaluation.kind === "invalid") {
    throw new DataProviderError("VALIDATION_ERROR", evaluation.message);
  }
  const client = requireClient();
  const user_id = await requireUserId(client);
  const { data, error } = await client
    .from("odometer_readings")
    .insert({ ...input, user_id, source: "manual" })
    .select("*")
    .single();
  if (error) throw toDataError(error);
  return { reading: data as OdometerReading, evaluation };
}
