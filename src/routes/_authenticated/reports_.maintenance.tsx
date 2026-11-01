import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { QueryErrorState, EmptyState } from "@/components/common/states";
import { MaintenanceReportWorkspace } from "@/features/reports/components/MaintenanceReportWorkspace";
import { maintenanceReportQuery } from "@/features/reports/services/maintenance-report.service";

export const Route = createFileRoute("/_authenticated/reports_/maintenance")({
  validateSearch: (search: Record<string, unknown>): { vehicleId?: string | undefined } => ({ vehicleId: typeof search['vehicleId'] === "string" ? search['vehicleId'] : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(maintenanceReportQuery),
  head: () => ({ meta: [
    { title: "تقرير الصيانة الشامل · كمتر" },
    { name: "description", content: "السجل الكامل لكل سيارة: الصيانة وأكواد OBD-II وقطع الغيار والتكاليف." },
    { property: "og:title", content: "تقرير الصيانة الشامل · كمتر" },
    { property: "og:description", content: "سجلات الصيانة والأعطال وقطع الغيار وتكلفة الصيانة لكل سيارة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: ReportError,
  notFoundComponent: () => <EmptyState title="التقرير غير موجود" />,
  component: ReportPage,
});
function ReportPage() { const { vehicleId } = Route.useSearch(); return <AppShell title="تقرير الصيانة الشامل"><MaintenanceReportWorkspace vehicleId={vehicleId} /></AppShell>; }
function ReportError({error}:ErrorComponentProps) { const router = useRouter(); return <AppShell title="تقرير الصيانة الشامل"><QueryErrorState error={error} onRetry={() => { void router.invalidate(); }} /></AppShell>; }