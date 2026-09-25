export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  model_year: number | null;
  trim: string | null;
  vin: string | null;
  plate_number: string | null;
  engine: string | null;
  transmission: string | null;
  fuel_type: string | null;
  color: string | null;
  purchase_date: string | null;
  purchase_odometer: number | null;
  purchase_price: number | null;
  current_odometer: number;
  image_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VehicleInput = Omit<
  Vehicle,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface OdometerReading {
  id: string;
  user_id: string;
  vehicle_id: string;
  reading: number;
  reading_date: string;
  source: string;
  notes: string | null;
  created_at: string;
}

export type OdometerReadingInput = Pick<
  OdometerReading,
  "vehicle_id" | "reading" | "reading_date" | "notes"
>;

export function vehicleTitle(vehicle: Vehicle): string {
  const parts = [vehicle.manufacturer, vehicle.model, vehicle.model_year]
    .filter(Boolean)
    .join(" ");
  return parts || vehicle.name;
}
