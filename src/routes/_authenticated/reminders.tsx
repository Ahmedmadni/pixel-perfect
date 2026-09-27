import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RemindersWorkspace } from "@/features/reminders/components/RemindersWorkspace";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "التذكيرات · كمتر" },
      { name: "description", content: "متابعة مواعيد التجديد والفحص والالتزامات القادمة." },
      { property: "og:title", content: "التذكيرات · كمتر" },
      { property: "og:description", content: "متابعة مواعيد التجديد والفحص والالتزامات القادمة." },
    ],
  }),
  component: () => (
    <AppShell title="التذكيرات" subtitle="المواعيد والاستحقاقات">
      <RemindersWorkspace />
    </AppShell>
  ),
});
