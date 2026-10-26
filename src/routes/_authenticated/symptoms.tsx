import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SymptomsWorkspace } from "@/features/symptoms/components/SymptomsWorkspace";

export const Route = createFileRoute("/_authenticated/symptoms")({
  validateSearch: (search: Record<string, unknown>): { vehicleId?: string; symptomId?: string } => ({
    ...(typeof search['vehicleId'] === "string" ? { vehicleId: search['vehicleId'] } : {}),
    ...(typeof search['symptomId'] === "string" ? { symptomId: search['symptomId'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "الأعراض وسجل السيارة · كمتر" },
      { name: "description", content: "ربط أعراض كل سيارة بسجل الأعطال والصيانة والعداد، ومتابعة الصيانة المستحقة." },
      { property: "og:title", content: "الأعراض وسجل السيارة · كمتر" },
      { property: "og:description", content: "متابعة الأعراض وأسبابها وسجلات الأعطال والصيانة المستحقة لكل سيارة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SymptomsPage,
});

function SymptomsPage() {
  const search = Route.useSearch();
  return <AppShell title="الأعراض وسجل السيارة" subtitle="الأعراض والأعطال والصيانة المستحقة">
    <SymptomsWorkspace key={`${search.vehicleId ?? ""}:${search.symptomId ?? ""}`} initialVehicleId={search.vehicleId} initialSymptomId={search.symptomId} />
  </AppShell>;
}
