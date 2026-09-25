import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { NotConnectedState } from "@/components/common/states";
import { VehicleForm } from "@/features/vehicles/components/VehicleForm";
import { useSaveVehicle } from "@/features/vehicles/hooks/useVehicles";
import { toVehicleInput } from "@/features/vehicles/schemas/vehicle.schema";
import { errorMessage } from "@/lib/data-provider";
import { isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/vehicles/new")({
  head: () => ({
    meta: [
      { title: "إضافة سيارة · كمتر" },
      { name: "description", content: "أضف سيارة جديدة ببياناتها الأساسية والتقنية وقراءة العداد." },
      { property: "og:title", content: "إضافة سيارة · كمتر" },
      { property: "og:description", content: "أضف سيارة جديدة ببياناتها الأساسية والتقنية وقراءة العداد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewVehiclePage,
});

function NewVehiclePage() {
  const navigate = useNavigate();
  const save = useSaveVehicle();
  return (
    <AppShell title="إضافة سيارة" subtitle="السيارات">
      {!isSupabaseConfigured ? (
        <div className="mb-4">
          <NotConnectedState compact description="يمكنك تعبئة النموذج، لكن الحفظ سيتاح بعد تفعيل الاتصال." />
        </div>
      ) : null}
      <VehicleForm
        submitLabel="حفظ السيارة"
        submitting={save.isPending}
        onCancel={() => navigate({ to: "/vehicles" })}
        onSubmit={(values) =>
          save.mutate(toVehicleInput(values), {
            onSuccess: (v) => {
              toast.success("تمت إضافة السيارة");
              navigate({ to: "/vehicles/$vehicleId", params: { vehicleId: v.id } });
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </AppShell>
  );
}
