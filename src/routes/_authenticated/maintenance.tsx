import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { MaintenanceWorkspace } from "@/features/maintenance/components/MaintenanceWorkspace";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "الصيانة · كمتر" },
      { name: "description", content: "سجل الصيانة الدورية والمجدولة لسياراتك." },
      { property: "og:title", content: "الصيانة · كمتر" },
      { property: "og:description", content: "سجل الصيانة الدورية والمجدولة لسياراتك." },
    ],
  }),
  component: () => (
    <AppShell title="الصيانة" subtitle="الجدول والسجل والفواتير">
      <MaintenanceWorkspace />
    </AppShell>
  ),
});
