import { useRef } from "react";
import { Car, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { secondaryBtn } from "@/components/common/buttons";
import { errorMessage } from "@/lib/data-provider";
import type { Vehicle } from "@/types/vehicle";
import { useVehicleImage, useVehicleImageUrl } from "../hooks/useVehicles";
import { validateImage } from "../services/vehicles.service";

export function VehicleImageManager({ vehicle }: { vehicle: Vehicle }) {
  const input = useRef<HTMLInputElement>(null);
  const url = useVehicleImageUrl(vehicle.image_url);
  const { upload, remove } = useVehicleImage(vehicle);
  const busy = upload.isPending || remove.isPending;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = validateImage(file);
    if (invalid) return void toast.error(invalid);
    upload.mutate(file, {
      onSuccess: () => toast.success("تم حفظ الصورة"),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-panel ring-1 ring-border">
      <div className="relative grid aspect-[16/7] place-items-center bg-secondary/50">
        {vehicle.image_url && url.data ? (
          <img src={url.data} alt={vehicle.name} className="h-full w-full object-cover" />
        ) : (
          <Car className="size-12 text-ink-soft" />
        )}
        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="size-6 animate-spin text-brand-deep" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={secondaryBtn}>
          <ImagePlus className="size-4" /> {vehicle.image_url ? "تغيير الصورة" : "رفع صورة"}
        </button>
        {vehicle.image_url ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => remove.mutate(undefined, { onSuccess: () => toast.success("تم حذف الصورة"), onError: (e) => toast.error(errorMessage(e)) })}
            className={`${secondaryBtn} text-destructive`}
          >
            <Trash2 className="size-4" /> حذف الصورة
          </button>
        ) : null}
        <span className="text-xs text-ink-soft">JPG أو PNG أو WEBP · حتى 5 ميجابايت</span>
      </div>
    </div>
  );
}
