import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SymptomsWorkspace } from "@/features/symptoms/components/SymptomsWorkspace";

export const Route = createFileRoute("/_authenticated/symptoms")({
  head: () => ({
    meta: [
      { title: "الأعراض وأسبابها · كمتر" },
      { name: "description", content: "إدارة أعراض السيارة وأسبابها وربطها بسجل الصيانة والعداد لاقتراح خطوات الإصلاح." },
      { property: "og:title", content: "الأعراض وأسبابها · كمتر" },
      { property: "og:description", content: "إدارة أعراض السيارة وأسبابها واقتراح خطوات الصيانة تلقائياً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell title="الأعراض وأسبابها" subtitle="قواعد تربط الأعراض بالصيانة والعداد">
      <SymptomsWorkspace />
    </AppShell>
  ),
});
