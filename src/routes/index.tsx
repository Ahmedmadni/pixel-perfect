import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Gauge, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة المتابعة · كمتر" },
      { name: "description", content: "نظرة عامة على عداد سيارتك وسجلاتها." },
      { property: "og:title", content: "لوحة المتابعة · كمتر" },
      { property: "og:description", content: "نظرة عامة على عداد سيارتك وسجلاتها." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell title="لوحة المتابعة" subtitle="أهلاً بعودتك">
      <section className="sheen glass relative overflow-hidden rounded-2xl p-6 ring-1 ring-border sm:p-8">
        <div className="relative flex flex-col items-start gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand-deep">
            <Car className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">ابدأ بإضافة سيارتك الأولى</h2>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              أضف بيانات سيارتك لتتمكن من تسجيل قراءات العداد ومتابعة صيانتها.
            </p>
          </div>
          <Link
            to="/vehicles"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-foreground ring-2 ring-accent/25 transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-4" />
            إضافة سيارة
          </Link>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
          <p className="text-xs text-ink-soft">العداد الحالي</p>
          <p className="num mt-2 text-2xl font-semibold leading-none text-ink-soft">—</p>
          <p className="mt-2 text-[11px] text-ink-soft">لا توجد سيارة بعد</p>
        </div>
        <div className="rounded-2xl bg-panel p-4 ring-1 ring-border">
          <p className="text-xs text-ink-soft">سجلات العداد</p>
          <p className="num mt-2 text-2xl font-semibold leading-none text-ink-soft">—</p>
          <p className="mt-2 text-[11px] text-ink-soft">لا توجد قراءات</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-panel p-4 ring-1 ring-border sm:col-span-1">
          <p className="text-xs text-ink-soft">السيارة النشطة</p>
          <p className="mt-2 text-sm font-semibold text-ink-soft">لم تُحدد بعد</p>
          <p className="mt-2 text-[11px] text-ink-soft">أضف سيارة لتفعيلها</p>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { title: "الصيانة القادمة", note: "قسم قريب — جاهز للتفعيل" },
          { title: "المصروفات الشهرية", note: "قسم قريب — جاهز للتفعيل" },
          { title: "التنبيهات", note: "قسم قريب — جاهز للتفعيل" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-dashed border-border bg-transparent p-4"
          >
            <p className="text-xs font-medium text-ink-soft">{card.title}</p>
            <p className="mt-2 text-[11px] text-ink-soft/70">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">سجل العداد</h2>
        <div className="rounded-2xl bg-panel p-8 text-center ring-1 ring-border">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-ink-soft">
            <Gauge className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium">لا توجد قراءات عداد</p>
          <p className="mt-1 text-xs text-ink-soft">
            ستظهر هنا قراءات العداد فور تسجيل أول قراءة لسيارتك.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
