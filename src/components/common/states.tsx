import { AlertTriangle, DatabaseZap, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, isNotConnected } from "@/lib/data-provider";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("rounded-2xl bg-panel p-8 text-center ring-1 ring-border sm:p-10", className)}>
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand-deep">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function NotConnectedState({
  title = "قاعدة البيانات غير متصلة حاليًا",
  description = "سيتم إظهار بياناتك هنا بعد تفعيل الاتصال.",
  compact,
}: {
  title?: string | undefined;
  description?: string | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 text-start",
        compact ? "p-4" : "p-6",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
        <DatabaseZap className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: (() => void) | undefined }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" />
      <p className="mt-2 text-sm font-semibold">{errorMessage(error)}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-brand-deep underline">
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

/** Shows not-connected vs generic error correctly. */
export function QueryErrorState(props: {
  error: unknown;
  onRetry?: (() => void) | undefined;
  notConnectedTitle?: string | undefined;
  notConnectedDescription?: string | undefined;
}) {
  if (isNotConnected(props.error))
    return <NotConnectedState title={props.notConnectedTitle} description={props.notConnectedDescription} />;
  return <ErrorState error={props.error} onRetry={props.onRetry} />;
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl bg-panel p-5 ring-1 ring-border">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-6 h-7 w-1/2" />
        </div>
      ))}
    </div>
  );
}

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-secondary text-ink-soft ring-border",
  brand: "bg-brand/10 text-brand-deep ring-brand/20",
  success: "bg-success/10 text-success ring-success/25",
  warning: "bg-accent/10 text-accent ring-accent/25",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
};

export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1", tones[tone])}>
      {children}
    </span>
  );
}
