import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات · كمتر" },
      { name: "description", content: "بيانات الحساب واللغة وتفضيلات التنبيهات." },
      { property: "og:title", content: "الإعدادات · كمتر" },
      { property: "og:description", content: "بيانات الحساب واللغة وتفضيلات التنبيهات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="الإعدادات" subtitle="حسابي">
      <section className="rounded-2xl bg-panel p-6 ring-1 ring-border">
        <h2 className="text-base font-semibold">الملف الشخصي</h2>
        <p className="mt-2 text-sm text-ink-soft">
          سيظهر هنا الاسم ورقم الهاتف واللغة وزر تسجيل الخروج بعد تفعيل الحسابات.
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-background p-4 ring-1 ring-border">
            <dt className="text-xs text-ink-soft">الاسم</dt>
            <dd className="mt-1 text-sm font-medium text-ink-soft">—</dd>
          </div>
          <div className="rounded-xl bg-background p-4 ring-1 ring-border">
            <dt className="text-xs text-ink-soft">رقم الهاتف</dt>
            <dd className="mt-1 text-sm font-medium text-ink-soft">—</dd>
          </div>
          <div className="rounded-xl bg-background p-4 ring-1 ring-border">
            <dt className="text-xs text-ink-soft">اللغة</dt>
            <dd className="mt-1 text-sm font-medium">العربية</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-border p-6">
        <h2 className="text-sm font-medium text-ink-soft">التنبيهات</h2>
        <p className="mt-2 text-xs text-ink-soft/70">
          إعدادات تذكيرات الصيانة ستُضاف في مرحلة لاحقة.
        </p>
      </section>
    </AppShell>
  );
}
