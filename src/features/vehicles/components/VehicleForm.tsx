import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { primaryBtn, secondaryBtn } from "@/components/common/buttons";
import {
  emptyVehicleForm,
  vehicleFormSchema,
  type VehicleFormValues,
} from "../schemas/vehicle.schema";
import { featuredYears, fuelOptions, manufacturerSuggestions, transmissionOptions } from "../lib/catalog";

const inputCls =
  "w-full rounded-xl bg-background px-3 py-2.5 text-sm ring-1 ring-border outline-none transition focus:ring-2 focus:ring-brand aria-[invalid=true]:ring-destructive";

function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-ink-soft">{hint}</span>
      ) : null}
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-panel p-5 ring-1 ring-border sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 text-sm font-semibold text-brand-deep">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function TextInput({ reg, invalid, ...rest }: { reg: UseFormRegisterReturn; invalid: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} {...reg} aria-invalid={invalid} className={inputCls} />;
}

export function VehicleForm({
  defaultValues = emptyVehicleForm,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  defaultValues?: VehicleFormValues;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: VehicleFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const manufacturer = watch("manufacturer");
  const model = watch("model");
  const modelYear = watch("model_year");
  const modelOptions = manufacturerSuggestions[manufacturer] ?? [];
  const years = featuredYears[`${manufacturer}|${model}`] ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Section title="معلومات أساسية">
        <Field label="اسم السيارة *" error={errors.name?.message} hint="مثال: سيارتي اليومية" className="sm:col-span-2">
          <TextInput reg={register("name")} invalid={!!errors.name} />
        </Field>
        <Field label="الشركة المصنعة" error={errors.manufacturer?.message}>
          <TextInput reg={register("manufacturer")} invalid={!!errors.manufacturer} list="manufacturers" dir="ltr" />
          <datalist id="manufacturers">
            {Object.keys(manufacturerSuggestions).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
        <Field label="الموديل" error={errors.model?.message}>
          <TextInput reg={register("model")} invalid={!!errors.model} list="models" dir="ltr" />
          <datalist id="models">
            {modelOptions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
        <Field label="سنة الصنع" error={errors.model_year?.message}>
          <TextInput reg={register("model_year")} invalid={!!errors.model_year} inputMode="numeric" dir="ltr" />
          {years.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setValue("model_year", String(y), { shouldValidate: true })}
                  className={cn(
                    "num rounded-lg px-2.5 py-1 text-xs ring-1 ring-border",
                    modelYear === String(y) ? "bg-brand text-primary-foreground ring-brand" : "bg-background",
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : null}
        </Field>
        <Field label="الفئة" error={errors.trim?.message} hint="مثال: GL، Limited">
          <TextInput reg={register("trim")} invalid={!!errors.trim} />
        </Field>
        <Field label="اللون" error={errors.color?.message}>
          <TextInput reg={register("color")} invalid={!!errors.color} />
        </Field>
      </Section>

      <Section title="بيانات تقنية">
        <Field label="المحرك" error={errors.engine?.message} hint="مثال: 1.8L 4 سلندر">
          <TextInput reg={register("engine")} invalid={!!errors.engine} />
        </Field>
        <Field label="ناقل الحركة">
          <select {...register("transmission")} className={inputCls}>
            <option value="">— اختر —</option>
            {transmissionOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="الوقود">
          <select {...register("fuel_type")} className={inputCls}>
            <option value="">— اختر —</option>
            {fuelOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="رقم الهيكل (VIN)" error={errors.vin?.message}>
          <TextInput reg={register("vin")} invalid={!!errors.vin} dir="ltr" maxLength={17} className={cn(inputCls, "uppercase")} />
        </Field>
      </Section>

      <Section title="الملكية">
        <Field label="رقم اللوحة" error={errors.plate_number?.message}>
          <TextInput reg={register("plate_number")} invalid={!!errors.plate_number} />
        </Field>
        <Field label="تاريخ الشراء" error={errors.purchase_date?.message}>
          <TextInput reg={register("purchase_date")} invalid={!!errors.purchase_date} type="date" dir="ltr" />
        </Field>
        <Field label="عداد الشراء (كم)" error={errors.purchase_odometer?.message}>
          <TextInput reg={register("purchase_odometer")} invalid={!!errors.purchase_odometer} inputMode="numeric" dir="ltr" />
        </Field>
        <Field label="قيمة الشراء (ريال)" error={errors.purchase_price?.message} hint="تُستخدم لحساب جدول الإهلاك (25 سنة، خردة 3,000 ريال)">
          <TextInput reg={register("purchase_price")} invalid={!!errors.purchase_price} inputMode="numeric" dir="ltr" />
        </Field>
        <Field label="العداد الحالي (كم) *" error={errors.current_odometer?.message}>
          <TextInput reg={register("current_odometer")} invalid={!!errors.current_odometer} inputMode="numeric" dir="ltr" />
        </Field>
      </Section>

      <Section title="إضافي">
        <Field label="رابط صورة السيارة" error={errors.image_url?.message} hint="رفع الصور مباشرة سيتوفر بعد ربط التخزين" className="sm:col-span-2">
          <TextInput reg={register("image_url")} invalid={!!errors.image_url} dir="ltr" placeholder="https://" />
        </Field>
        <Field label="ملاحظات" error={errors.notes?.message} className="sm:col-span-2">
          <textarea {...register("notes")} rows={3} className={inputCls} />
        </Field>
      </Section>

      <div className="sticky bottom-20 flex gap-2 rounded-2xl bg-panel/95 p-3 ring-1 ring-border backdrop-blur lg:bottom-4">
        <button type="submit" disabled={submitting} className={primaryBtn}>
          {submitting ? "جارٍ الحفظ..." : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className={secondaryBtn}>
          إلغاء
        </button>
      </div>
    </form>
  );
}
