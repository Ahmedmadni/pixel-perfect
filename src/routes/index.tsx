import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Gauge, Plus, Receipt, Wrench, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, NotConnectedState, QueryErrorState } from "@/components/common/states";
import { primaryBtn } from "@/components/common/buttons";
import { Skeleton } from "@/components/ui/skeleton";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { isNotConnected } from "@/lib/data-provider";
import { formatKm } from "@/lib/format";
import { vehicleTitle } from "@/types/vehicle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة المتابعة · كمتر" },
      { name: "description", content: "متابعة حالة سيارتك وعدادها وصيانتها من مكان واحد." },
      { property: "og:title", content: "لوحة المتابعة · كمتر" },
      { property: "og:description", content: "متابعة حالة سيارتك وعدادها وصيانتها من مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function QuickAction({ icon: Icon, label, to, soon }: { icon: LucideIcon; label: string; to: "/vehicles/new" | "/vehicles" | "/maintenance" | "/expenses"; soon?: boolean }) {
  return (
    <Link to={to} className="flex flex-col items-start gap-3 rounded-2xl bg-panel p-4 ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand-deep"><Icon className="size-5" /></span>
      <span className="text-sm font-medium">{label}</span>
      {soon ? <span className="text-[10px] text-ink-soft">قريباً</span> : null}
    </Link>
  );
}

function Dashboard() {
  const q = useVehicles();
  const primary = q.data?.find((v) => v.is_active) ?? q.data?.[0];

  return (
    <AppShell title="مرحبًا بك" subtitle="متابعة حالة سيارتك">
      {q.isPending ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : q.isError ? (
        isNotConnected(q.error) ? (
          <NotConnectedState title="قاعدة البيانات غير متصلة بعد" description="ستظهر هنا سيارتك وقراءة العداد الحالية فور تفعيل الاتصال." />
        ) : (
          <QueryErrorState error={q.error} onRetry={() => q.refetch()} />
        )
      ) : !primary ? (
        <EmptyState icon={Car} title="لا توجد سيارات مسجلة حتى الآن" description="ابدأ بإضافة سيارتك الأولى" action={<Link to="/vehicles/new" className={primaryBtn}><Plus className="size-4" /> إضافة سيارة</Link>} />
      ) : (
        <Link to="/vehicles/$vehicleId" params={{ vehicleId: primary.id }} className="block rounded-2xl bg-brand-deep p-6 text-primary-foreground shadow-lg sm:p-8">
          <p className="text-sm opacity-80" dir="auto">{vehicleTitle(primary)}</p>
          <p className="mt-4 flex items-center gap-2 text-sm opacity-80"><Gauge className="size-4" /> العداد الحالي</p>
          <p className="num mt-1 text-4xl font-semibold sm:text-5xl">{formatKm(primary.current_odometer)}</p>
        </Link>
      )}

      <h2 className="mt-8 mb-3 text-base font-semibold">إجراءات سريعة</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={Plus} label="إضافة سيارة" to="/vehicles/new" />
        <QuickAction icon={Gauge} label="تحديث العداد" to="/vehicles" />
        <QuickAction icon={Wrench} label="تسجيل صيانة" to="/maintenance" soon />
        <QuickAction icon={Receipt} label="إضافة مصروف" to="/expenses" soon />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {["الصيانة القادمة", "المصروفات الشهرية", "التنبيهات"].map((t) => (
          <div key={t} className="rounded-2xl border border-dashed border-border p-4">
            <p className="text-sm font-medium">{t}</p>
            <p className="mt-1 text-xs text-ink-soft">سيتوفر في المرحلة القادمة</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
