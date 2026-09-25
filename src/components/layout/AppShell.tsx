import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Car,
  Wrench,
  Receipt,
  Cog,
  AlertTriangle,
  BarChart3,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/vehicles", label: "سياراتي", icon: Car },
  { to: "/maintenance", label: "الصيانة", icon: Wrench },
  { to: "/expenses", label: "المصروفات", icon: Receipt },
  { to: "/parts", label: "قطع الغيار", icon: Cog },
  { to: "/issues", label: "الأعطال", icon: AlertTriangle },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

const mobileItems = navItems.filter((item) =>
  ["/", "/vehicles", "/maintenance", "/settings"].includes(item.to),
);

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[380px] w-[380px] rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-e border-border bg-panel/70 p-6 backdrop-blur lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-[10px] bg-brand-deep text-primary-foreground">
              <span className="num text-sm font-semibold">كم</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">كمتر</p>
              <p className="mt-1 text-[11px] text-ink-soft">تتبع صيانة السيارة</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-secondary"
                activeProps={{
                  className:
                    "bg-brand/10 font-medium text-brand-deep ring-1 ring-brand/20 hover:bg-brand/10",
                }}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-xl bg-background p-4 ring-1 ring-border">
            <p className="text-[11px] font-medium text-ink-soft">المرحلة الحالية</p>
            <p className="mt-1 text-sm font-semibold">الأساس · العداد والسيارات</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pb-10">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              {subtitle ? <p className="text-xs text-ink-soft">{subtitle}</p> : null}
              <h1 className="text-balance text-xl font-semibold sm:text-2xl">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {action}
              <div className="grid size-9 place-items-center rounded-full bg-secondary text-ink-soft ring-1 ring-border">
                <User className="size-4" />
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-panel/80 px-2 py-2 backdrop-blur lg:hidden">
        {mobileItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-ink-soft"
            activeProps={{ className: "text-brand-deep" }}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-secondary">
              <Icon className="size-4" />
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
