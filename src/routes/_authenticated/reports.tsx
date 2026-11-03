import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { ReportsWorkspace } from "@/features/reports/components/ReportsWorkspace";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير · كمتر" },
      { name: "description", content: "تقارير الأعطال الشاملة والتشخيص ومصروفات وتشغيل السيارة." },
      { property: "og:title", content: "التقارير · كمتر" },
      { property: "og:description", content: "تقارير المصروفات والتكاليف ومؤشرات تشغيل السيارة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell title="التقارير" subtitle="تقارير الأعطال الشاملة والتحليل التشغيلي">
      <div className="mb-6 flex flex-wrap gap-3 border-b border-border pb-5 print:hidden">
        <Button asChild><Link to="/reports/maintenance"><FileText /> تقرير الصيانة الشامل لكل سيارة</Link></Button>
        <Button variant="outline" asChild><Link to="/reports/fault-codes"><Sparkles /> تقرير أكواد الأعطال وتحليل AI</Link></Button>
      </div>
      <ReportsWorkspace />
    </AppShell>
  ),
});
