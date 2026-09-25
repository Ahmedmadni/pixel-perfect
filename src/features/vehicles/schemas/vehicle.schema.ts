import { z } from "zod";
import type { VehicleInput } from "@/types/vehicle";

const currentYear = new Date().getFullYear();
const optionalText = (max: number) => z.string().trim().max(max, `الحد الأقصى ${max} حرف`);
const optionalInt = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), `${label} يجب أن يكون رقمًا صحيحًا`)
    .refine((v) => v === "" || (Number(v) >= min && Number(v) <= max), `${label} خارج النطاق المسموح`);

export const vehicleFormSchema = z
  .object({
    name: z.string().trim().min(2, "اسم السيارة مطلوب").max(60, "الحد الأقصى 60 حرف"),
    manufacturer: optionalText(40),
    model: optionalText(40),
    model_year: optionalInt("سنة الصنع", 1950, currentYear + 1),
    trim: optionalText(40),
    color: optionalText(30),
    engine: optionalText(40),
    transmission: z.string(),
    fuel_type: z.string(),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => v === "" || /^[A-HJ-NPR-Z0-9]{17}$/.test(v), "رقم الهيكل يجب أن يكون 17 خانة (بدون I, O, Q)"),
    plate_number: optionalText(20),
    purchase_date: z
      .string()
      .refine((v) => v === "" || new Date(v) <= new Date(), "تاريخ الشراء لا يمكن أن يكون في المستقبل"),
    purchase_odometer: optionalInt("عداد الشراء", 0, 3_000_000),
    purchase_price: optionalInt("قيمة الشراء", 0, 100_000_000),
    current_odometer: z
      .string()
      .trim()
      .min(1, "العداد الحالي مطلوب")
      .refine((v) => /^\d+$/.test(v), "العداد يجب أن يكون رقمًا صحيحًا موجبًا")
      .refine((v) => Number(v) <= 3_000_000, "القيمة كبيرة جدًا"),
    image_url: z
      .string()
      .trim()
      .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "رابط الصورة غير صالح"),
    notes: optionalText(1000),
  })
  .refine(
    (d) =>
      d.purchase_odometer === "" ||
      d.current_odometer === "" ||
      Number(d.current_odometer) >= Number(d.purchase_odometer),
    { path: ["current_odometer"], message: "العداد الحالي لا يمكن أن يكون أقل من عداد الشراء" },
  );

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const emptyVehicleForm: VehicleFormValues = {
  name: "",
  manufacturer: "",
  model: "",
  model_year: "",
  trim: "",
  color: "",
  engine: "",
  transmission: "",
  fuel_type: "",
  vin: "",
  plate_number: "",
  purchase_date: "",
  purchase_odometer: "",
  purchase_price: "",
  current_odometer: "",
  image_url: "",
  notes: "",
};

const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export function toVehicleInput(v: VehicleFormValues): VehicleInput {
  return {
    name: v.name.trim(),
    manufacturer: orNull(v.manufacturer),
    model: orNull(v.model),
    model_year: numOrNull(v.model_year),
    trim: orNull(v.trim),
    color: orNull(v.color),
    engine: orNull(v.engine),
    transmission: orNull(v.transmission),
    fuel_type: orNull(v.fuel_type),
    vin: orNull(v.vin),
    plate_number: orNull(v.plate_number),
    purchase_date: orNull(v.purchase_date),
    purchase_odometer: numOrNull(v.purchase_odometer),
    purchase_price: numOrNull(v.purchase_price),
    current_odometer: Number(v.current_odometer),
    image_url: orNull(v.image_url),
    notes: orNull(v.notes),
    is_active: true,
  };
}

export function fromVehicle(v: VehicleInput): VehicleFormValues {
  const s = (x: string | number | null) => (x === null ? "" : String(x));
  return {
    name: v.name,
    manufacturer: s(v.manufacturer),
    model: s(v.model),
    model_year: s(v.model_year),
    trim: s(v.trim),
    color: s(v.color),
    engine: s(v.engine),
    transmission: s(v.transmission),
    fuel_type: s(v.fuel_type),
    vin: s(v.vin),
    plate_number: s(v.plate_number),
    purchase_date: s(v.purchase_date),
    purchase_odometer: s(v.purchase_odometer),
    purchase_price: s(v.purchase_price),
    current_odometer: s(v.current_odometer),
    image_url: s(v.image_url),
    notes: s(v.notes),
  };
}
