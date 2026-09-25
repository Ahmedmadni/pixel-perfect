import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "المصروفات · كمتر" },
      { name: "description", content: "تتبع مصروفات الوقود والصيانة والإصلاحات." },
      { property: "og:title", content: "المصروفات · كمتر" },
      { property: "og:description", content: "تتبع مصروفات الوقود والصيانة والإصلاحات." },
    ],
  }),
  component: () => (
    <AppShell title="المصروفات" subtitle="التكاليف">
      <ComingSoon
        title="سجل المصروفات"
        description="ستتمكن من تسجيل الوقود والإصلاحات ومتابعة التكلفة الشهرية لكل سيارة."
      />
    </AppShell>
  ),
});
