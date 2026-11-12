import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ObdCodesWorkspace } from "@/features/diagnostics/components/ObdCodesWorkspace";

export const Route = createFileRoute("/_authenticated/obd-codes")({
  head: () => ({
    meta: [
      { title: "إدارة أكواد OBD-II · كمتر" },
      { name: "description", content: "ابحث في مكتبة أكواد الأعطال القياسية وأضف أكوادك وأوصافك وفئاتك الخاصة." },
      { property: "og:title", content: "إدارة أكواد OBD-II · كمتر" },
      { property: "og:description", content: "مكتبة أكواد أعطال قياسية مع أكواد وفئات مخصصة لكل مستخدم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell title="أكواد OBD-II" subtitle="المكتبة القياسية وأكوادك الخاصة">
      <ObdCodesWorkspace />
    </AppShell>
  ),
});
