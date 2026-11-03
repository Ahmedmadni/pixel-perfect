import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { QueryErrorState } from "@/components/common/states";
import { FaultCodeReportWorkspace } from "@/features/reports/components/FaultCodeReportWorkspace";
import { maintenanceReportQuery } from "@/features/reports/services/maintenance-report.service";

export const Route = createFileRoute("/_authenticated/reports_/fault-codes")({
  validateSearch: (search: Record<string, unknown>): { vehicleId?: string | undefined } => ({ vehicleId: typeof search['vehicleId'] === "string" ? search['vehicleId'] : undefined }),
  loader: ({ context }) => context.queryClient.ensureQueryData(maintenanceReportQuery),
  head: () => ({ meta: [
    { title: "تقرير أكواد الأعطال · كمتر" },
    { name: "description", content: "أكواد OBD-II لكل سيارة مع تحليل الأعطال بالذكاء الاصطناعي." },
    { property: "og:title", content: "تقرير أكواد الأعطال · كمتر" },
    { property: "og:description", content: "تكرار أكواد الأعطال وأنماطها وتوصيات الذكاء الاصطناعي." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: ReportError,
  component: ReportPage,
});
function ReportPage() { const { vehicleId } = Route.useSearch(); return <AppShell title="تقرير أكواد الأعطال"><FaultCodeReportWorkspace vehicleId={vehicleId} /></AppShell>; }
function ReportError({ error }: ErrorComponentProps) { const router = useRouter(); return <AppShell title="تقرير أكواد الأعطال"><QueryErrorState error={error} onRetry={() => { void router.invalidate(); }} /></AppShell>; }
