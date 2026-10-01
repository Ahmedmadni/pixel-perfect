import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ReportsWorkspace } from "@/features/reports/components/ReportsWorkspace";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير · كمتر" },
      { name: "description", content: "تقارير الأعطال الشاملة والتشخيص ومصروفات وتشغيل السيارة." },
      { property: "og:title", content: "التقارير · كمتر" },
      { property: "og:description", content: "تقارير المصروفات والتكاليف ومؤشرات تشغيل السيارة." },
    ],
  }),
  component: () => (
    <AppShell title="التقارير" subtitle="تقارير الأعطال الشاملة والتحليل التشغيلي">
      <ReportsWorkspace />
    </AppShell>
  ),
});
