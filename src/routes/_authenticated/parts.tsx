import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PartsWorkspace } from "@/features/parts/components/PartsWorkspace";

export const Route = createFileRoute("/_authenticated/parts")({
  head: () => ({
    meta: [
      { title: "قطع الغيار · كمتر" },
      { name: "description", content: "أرشيف قطع الغيار وأسعارها ومورديها." },
      { property: "og:title", content: "قطع الغيار · كمتر" },
      { property: "og:description", content: "أرشيف قطع الغيار وأسعارها ومورديها." },
    ],
  }),
  component: () => (
    <AppShell title="قطع الغيار" subtitle="الأرقام والأسعار والموردون وسجل التركيب">
      <PartsWorkspace />
    </AppShell>
  ),
});
