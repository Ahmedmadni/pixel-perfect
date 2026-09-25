import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير · كمتر" },
      { name: "description", content: "تقارير الاستهلاك والتكاليف ومعدل القيادة." },
      { property: "og:title", content: "التقارير · كمتر" },
      { property: "og:description", content: "تقارير الاستهلاك والتكاليف ومعدل القيادة." },
    ],
  }),
  component: () => (
    <AppShell title="التقارير" subtitle="التحليلات">
      <ComingSoon
        title="التقارير"
        description="ستعرض هنا تقارير المسافات والتكاليف بعد تجميع بيانات كافية."
      />
    </AppShell>
  ),
});
