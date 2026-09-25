import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { CardsSkeleton, QueryErrorState } from "@/components/common/states";
import { VehicleForm } from "@/features/vehicles/components/VehicleForm";
import { useSaveVehicle, useVehicle } from "@/features/vehicles/hooks/useVehicles";
import { fromVehicle, toVehicleInput } from "@/features/vehicles/schemas/vehicle.schema";
import { errorMessage } from "@/lib/data-provider";

export const Route = createFileRoute("/_authenticated/vehicles/$vehicleId/edit")({
  head: () => ({
    meta: [
      { title: "تعديل السيارة · كمتر" },
      { name: "description", content: "تعديل بيانات السيارة." },
      { property: "og:title", content: "تعديل السيارة · كمتر" },
      { property: "og:description", content: "تعديل بيانات السيارة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditVehiclePage,
});

function EditVehiclePage() {
  const { vehicleId } = Route.useParams();
  const navigate = useNavigate();
  const q = useVehicle(vehicleId);
  const save = useSaveVehicle(vehicleId);
  const back = () => navigate({ to: "/vehicles/$vehicleId", params: { vehicleId } });

  return (
    <AppShell title="تعديل السيارة" subtitle="السيارات">
      {q.isPending ? (
        <CardsSkeleton count={2} />
      ) : q.isError ? (
        <QueryErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <VehicleForm
          defaultValues={fromVehicle(q.data)}
          submitLabel="حفظ التعديلات"
          submitting={save.isPending}
          onCancel={back}
          onSubmit={(values) =>
            save.mutate(toVehicleInput(values), {
              onSuccess: () => {
                toast.success("تم حفظ التعديلات");
                back();
              },
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        />
      )}
    </AppShell>
  );
}
