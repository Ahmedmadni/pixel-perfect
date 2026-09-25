import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-panel/50 p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand-deep">
        <Sparkles className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{description}</p>
      <p className="mt-4 inline-flex rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-ink-soft">
        قريباً في المرحلة القادمة
      </p>
    </div>
  );
}
