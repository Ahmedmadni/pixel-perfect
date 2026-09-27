import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Gauge, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { CardsSkeleton, QueryErrorState, StatusBadge } from "@/components/common/states";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { secondaryBtn } from "@/components/common/buttons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteVehicle, useSetActiveVehicle, useVehicle } from "@/features/vehicles/hooks/useVehicles";
import { VehicleImageManager } from "@/features/vehicles/components/VehicleImageManager";
import { fuelOptions, labelOf, transmissionOptions } from "@/features/vehicles/lib/catalog";
import { DepreciationSchedule } from "@/features/depreciation/components/DepreciationSchedule";
import { OdometerForm } from "@/features/odometer/components/OdometerForm";
import { OdometerHistory } from "@/features/odometer/components/OdometerHistory";
import { MaintenanceWorkspace } from "@/features/maintenance/components/MaintenanceWorkspace";
import { ExpenseWorkspace } from "@/features/expenses/components/ExpenseWorkspace";
import { PartsWorkspace } from "@/features/parts/components/PartsWorkspace";
import { DiagnosticsWorkspace } from "@/features/diagnostics/components/DiagnosticsWorkspace";
import { errorMessage } from "@/lib/data-provider";
import { formatDate, formatKm, formatNumber } from "@/lib/format";
import { vehicleTitle, type Vehicle } from "@/types/vehicle";

type Tab = "overview" | "odometer" | "depreciation" | "maintenance" | "expenses" | "parts" | "diagnostics" | "documents";
const tabs: { value: Tab; label: string }[] = [
  { value: "overview", label: "نظرة عامة" },
  { value: "odometer", label: "العداد" },
  { value: "depreciation", label: "الإهلاك" },
  { value: "maintenance", label: "الصيانة" },
  { value: "expenses", label: "المصروفات" },
  { value: "parts", label: "قطع الغيار" },
  { value: "diagnostics", label: "الأعطال" },
  { value: "documents", label: "المستندات" },
];

export const Route = createFileRoute("/_authenticated/vehicles/$vehicleId/")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => ({
    tab: tabs.some((t) => t.value === s["tab"]) ? (s["tab"] as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تفاصيل السيارة · كمتر" },
      { name: "description", content: "بيانات السيارة وسجل قراءات العداد." },
      { property: "og:title", content: "تفاصيل السيارة · كمتر" },
      { property: "og:description", content: "بيانات السيارة وسجل قراءات العداد." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const q = useVehicle(vehicleId);
  const del = useDeleteVehicle();
  const setActive = useSetActiveVehicle();

  const title = q.data ? q.data.name : "تفاصيل السيارة";

  return (
    <AppShell
      title={title}
      subtitle={q.data ? vehicleTitle(q.data) : "السيارات"}
      action={
        q.data ? (
          <div className="flex gap-2">
            {!q.data.is_active ? (
              <button
                className={secondaryBtn}
                disabled={setActive.isPending}
                onClick={() =>
                  setActive.mutate(vehicleId, {
                    onSuccess: () => { toast.success("أصبحت هذه السيارة النشطة"); q.refetch(); },
                    onError: (e) => toast.error(errorMessage(e)),
                  })
                }
              >
                <Star className="size-4" /> <span className="hidden sm:inline">اجعلها السيارة النشطة</span>
              </button>
            ) : null}
            <Link to="/vehicles/$vehicleId/edit" params={{ vehicleId }} className={secondaryBtn}>
              <Pencil className="size-4" /> <span className="hidden sm:inline">تعديل</span>
            </Link>
            <ConfirmDialog
              title="حذف السيارة؟"
              description="هل أنت متأكد من حذف هذه السيارة؟ سيتم حذف السيارة وصورتها وقراءات العداد وسجلات الصيانة والمصروفات وقطع الغيار وسجل الأعطال المرتبط بها نهائيًا، ولا يمكن التراجع."
              confirmLabel="حذف"
              onConfirm={() =>
                del.mutate(vehicleId, {
                  onSuccess: () => {
                    toast.success("تم حذف السيارة");
                    navigate({ to: "/vehicles" });
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
              trigger={
                <button className={`${secondaryBtn} text-destructive`} aria-label="حذف">
                  <Trash2 className="size-4" />
                </button>
              }
            />
          </div>
        ) : null
      }
    >
      <Tabs value={tab} onValueChange={(v) => navigate({ to: ".", search: { tab: v as Tab } })} dir="rtl">
        <TabsList className="mb-4 h-auto w-full justify-start overflow-x-auto rounded-xl bg-panel p-1 ring-1 ring-border">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="shrink-0 rounded-lg px-3 py-2 data-[state=active]:bg-brand/10 data-[state=active]:text-brand-deep">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {q.isPending ? (
          <CardsSkeleton count={3} />
        ) : q.isError ? (
          <QueryErrorState error={q.error} onRetry={() => q.refetch()} notConnectedDescription="ستظهر بيانات السيارة هنا بعد تفعيل الاتصال." />
        ) : (
          <>
            <TabsContent value="overview" className="space-y-4"><VehicleImageManager vehicle={q.data} /><Overview vehicle={q.data} /></TabsContent>
            <TabsContent value="depreciation"><DepreciationSchedule vehicle={q.data} /></TabsContent>
            <TabsContent value="odometer" className="space-y-4">
              <OdometerForm vehicleId={vehicleId} currentOdometer={q.data.current_odometer} />
              <h3 className="text-sm font-semibold">سجل العداد</h3>
              <OdometerHistory vehicleId={vehicleId} />
            </TabsContent>
            <TabsContent value="maintenance">
              <MaintenanceWorkspace vehicleId={vehicleId} />
            </TabsContent>
            <TabsContent value="expenses">
              <ExpenseWorkspace vehicleId={vehicleId} />
            </TabsContent>
            <TabsContent value="parts">
              <PartsWorkspace vehicleId={vehicleId} />
            </TabsContent>
            <TabsContent value="diagnostics">
              <DiagnosticsWorkspace vehicleId={vehicleId} />
            </TabsContent>
            {tabs.filter((t) => ["documents"].includes(t.value)).map((t) => (
              <TabsContent key={t.value} value={t.value}>
                <ComingSoon title={t.label} description={`قسم ${t.label} لهذه السيارة سيتوفر في المرحلة القادمة.`} />
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
    </AppShell>
  );
}

function Overview({ vehicle: v }: { vehicle: Vehicle }) {
  const items: [string, string][] = [
    ["الشركة المصنعة", v.manufacturer ?? "—"],
    ["الموديل", v.model ?? "—"],
    ["سنة الصنع", v.model_year ? String(v.model_year) : "—"],
    ["الفئة", v.trim ?? "—"],
    ["اللون", v.color ?? "—"],
    ["المحرك", v.engine ?? "—"],
    ["ناقل الحركة", labelOf(transmissionOptions, v.transmission)],
    ["الوقود", labelOf(fuelOptions, v.fuel_type)],
    ["رقم الهيكل", v.vin ?? "—"],
    ["رقم اللوحة", v.plate_number ?? "—"],
    ["تاريخ الشراء", v.purchase_date ? formatDate(v.purchase_date) : "—"],
    ["قيمة الشراء", v.purchase_price !== null ? `${formatNumber(v.purchase_price)} ر.س` : "—"],
    ["عداد الشراء", v.purchase_odometer !== null ? formatKm(v.purchase_odometer) : "—"],
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-brand-deep p-6 text-primary-foreground">
        <div>
          <p className="flex items-center gap-2 text-sm opacity-80"><Gauge className="size-4" /> العداد الحالي</p>
          <p className="num mt-2 text-4xl font-semibold">{formatKm(v.current_odometer)}</p>
        </div>
        <StatusBadge tone={v.is_active ? "success" : "neutral"}>{v.is_active ? "نشطة" : "غير نشطة"}</StatusBadge>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([k, val]) => (
          <div key={k} className="rounded-xl bg-panel p-4 ring-1 ring-border">
            <dt className="text-xs text-ink-soft">{k}</dt>
            <dd className="mt-1 text-sm font-medium" dir="auto">{val}</dd>
          </div>
        ))}
      </dl>
      {v.notes ? <p className="rounded-xl bg-panel p-4 text-sm ring-1 ring-border">{v.notes}</p> : null}
    </div>
  );
}
