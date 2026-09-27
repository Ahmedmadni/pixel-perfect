import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ReportsWorkspace } from "@/features/reports/components/ReportsWorkspace";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير · كمتر" },
      { name: "description", content: "تقارير المصروفات والتكاليف ومؤشرات تشغيل السيارة." },
      { property: "og:title", content: "التقارير · كمتر" },
      { property: "og:description", content: "تقارير المصروفات والتكاليف ومؤشرات تشغيل السيارة." },
    ],
  }),
  component: () => (
    <AppShell title="التقارير" subtitle="تحليل التكاليف واتجاهات التشغيل">
      <ReportsWorkspace />
    </AppShell>
  ),
});
