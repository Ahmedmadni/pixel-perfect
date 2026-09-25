import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({
    meta: [
      { title: "الأعطال · كمتر" },
      { name: "description", content: "توثيق الأعطال وأكواد الفحص ومتابعة إصلاحها." },
      { property: "og:title", content: "الأعطال · كمتر" },
      { property: "og:description", content: "توثيق الأعطال وأكواد الفحص ومتابعة إصلاحها." },
    ],
  }),
  component: () => (
    <AppShell title="الأعطال" subtitle="التشخيص">
      <ComingSoon
        title="سجل الأعطال"
        description="ستتمكن من توثيق الأعطال وأكواد OBD ومتابعة حالة الإصلاح."
      />
    </AppShell>
  ),
});
