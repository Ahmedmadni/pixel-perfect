import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/parts")({
  head: () => ({
    meta: [
      { title: "قطع الغيار · كمتر" },
      { name: "description", content: "أرشيف قطع الغيار وأسعارها ومورديها." },
      { property: "og:title", content: "قطع الغيار · كمتر" },
      { property: "og:description", content: "أرشيف قطع الغيار وأسعارها ومورديها." },
    ],
  }),
  component: () => (
    <AppShell title="قطع الغيار" subtitle="الأرشيف">
      <ComingSoon
        title="قطع الغيار"
        description="ستتمكن من حفظ القطع المستبدلة وأسعارها وموردينها لكل سيارة."
      />
    </AppShell>
  ),
});
