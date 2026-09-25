import { createFileRoute } from "@tanstack/react-router";
import { Car, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "سياراتي · كمتر" },
      { name: "description", content: "إدارة سياراتك وبياناتها وعداداتها." },
      { property: "og:title", content: "سياراتي · كمتر" },
      { property: "og:description", content: "إدارة سياراتك وبياناتها وعداداتها." },
    ],
  }),
  component: VehiclesPage,
});

function VehiclesPage() {
  return (
    <AppShell
      title="سياراتي"
      subtitle="إدارة المركبات"
      action={
        <button
          onClick={() =>
            toast.info("حفظ السيارات غير متاح بعد", {
              description: "سيتم تفعيل الحفظ بعد تجهيز قاعدة البيانات والحسابات.",
            })
          }
          className="inline-flex items-center gap-2 rounded-lg bg-brand-deep px-3 py-2 text-xs font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-3.5" />
          إضافة سيارة
        </button>
      }
    >
      <div className="rounded-2xl bg-panel p-10 text-center ring-1 ring-border">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand-deep">
          <Car className="size-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold">لا توجد سيارات مسجلة</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          ستظهر بطاقات سياراتك هنا مع العداد الحالي ورقم اللوحة وأزرار العرض والتعديل
          والحذف.
        </p>
      </div>
    </AppShell>
  );
}
