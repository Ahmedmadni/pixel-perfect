import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DiagnosticsWorkspace } from "@/features/diagnostics/components/DiagnosticsWorkspace";

export const Route = createFileRoute("/_authenticated/diagnostics")({
  head: () => ({
    meta: [
      { title: "الأعطال · كمتر" },
      { name: "description", content: "توثيق الأعطال وأكواد الفحص ومتابعة إصلاحها." },
      { property: "og:title", content: "الأعطال · كمتر" },
      { property: "og:description", content: "توثيق الأعطال وأكواد الفحص ومتابعة إصلاحها." },
    ],
  }),
  component: () => (
    <AppShell title="الأعطال" subtitle="التشخيص وأكواد OBD وسجل الإصلاح">
      <DiagnosticsWorkspace />
    </AppShell>
  ),
});
