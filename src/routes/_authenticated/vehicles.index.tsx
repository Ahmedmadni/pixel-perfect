import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CardsSkeleton, EmptyState, QueryErrorState } from "@/components/common/states";
import { primaryBtn } from "@/components/common/buttons";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { VehicleCard } from "@/features/vehicles/components/VehicleCard";

export const Route = createFileRoute("/_authenticated/vehicles/")({
  head: () => ({
    meta: [
      { title: "سياراتي · كمتر" },
      { name: "description", content: "إدارة جميع سياراتك وقراءات عداداتها في مكان واحد." },
      { property: "og:title", content: "سياراتي · كمتر" },
      { property: "og:description", content: "إدارة جميع سياراتك وقراءات عداداتها في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VehiclesPage,
});

function AddButton() {
  return (
    <Link to="/vehicles/new" className={primaryBtn}>
      <Plus className="size-4" /> إضافة سيارة
    </Link>
  );
}

function VehiclesPage() {
  const q = useVehicles();
  return (
    <AppShell title="سياراتي" subtitle="السيارات" action={<AddButton />}>
      {q.isPending ? (
        <CardsSkeleton />
      ) : q.isError ? (
        <QueryErrorState error={q.error} onRetry={() => q.refetch()} notConnectedDescription="سيتم إظهار سياراتك هنا بعد تفعيل الاتصال." />
      ) : q.data.length === 0 ? (
        <EmptyState icon={Car} title="لا توجد سيارات مسجلة حتى الآن" description="ابدأ بإضافة سيارتك الأولى" action={<AddButton />} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      )}
    </AppShell>
  );
}
