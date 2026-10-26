import { Link } from "@tanstack/react-router";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { QueryErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/types/vehicle";
import { useSymptomHistory } from "../hooks/useSymptomHistory";

export function SymptomDueCard({ vehicle }: { vehicle: Vehicle }) {
  const history = useSymptomHistory(vehicle);
  if (history.isPending) return <Skeleton className="h-44 w-full rounded-2xl" />;
  if (history.error) return <QueryErrorState error={history.error} onRetry={history.refetch} />;
  const due = history.links.filter((link) => link.maintenanceDue);
  return <section className="space-y-3 border-t border-border py-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold"><Stethoscope className="size-5 text-accent" /> أعطال مستحقة للصيانة · {vehicle.name}</h2>
      <Button asChild variant="link" size="sm"><Link to="/symptoms" search={{ vehicleId: vehicle.id }}>الأعراض وسجل السيارة <ArrowLeft /></Link></Button>
    </div>
    {due.length ? <ul className="grid gap-3 sm:grid-cols-2">{due.map((link) => <li key={link.symptom.id} className="rounded-lg border border-border bg-panel p-4">
      <Link to="/symptoms" search={{ vehicleId: vehicle.id, symptomId: link.symptom.id }} className="text-sm font-semibold text-brand-deep">{link.symptom.name}</Link>
      <p className="mt-1 text-sm">{link.activeIssues.map((i) => i.title).join(" · ")}</p>
      <p className="mt-2 text-xs text-ink-soft">{link.dueCauses.map((c) => c.cause.cause).join(" · ")}</p>
    </li>)}</ul> : <p className="text-sm text-ink-soft">لا توجد أعطال نشطة مرتبطة بصيانة مستحقة للأعراض المسجلة.</p>}
  </section>;
}