import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

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
    <AppShell title="الصيانة" subtitle="سجل الأعمال">
      <ComingSoon
        title="سجل الصيانة"
        description="ستتمكن من تسجيل أعمال الصيانة وجدولتها حسب الكيلومترات أو التاريخ."
      />
    </AppShell>
  ),
});
