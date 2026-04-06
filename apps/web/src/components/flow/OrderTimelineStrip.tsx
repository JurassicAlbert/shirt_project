"use client";

import { useTranslations } from "next-intl";

export type TimelineStepVm = {
  status: string;
  phase: "done" | "current" | "upcoming" | "skipped";
};

export function OrderTimelineStrip({ steps, showFailedBanner }: { steps: TimelineStepVm[]; showFailedBanner?: boolean }) {
  const tOrder = useTranslations("state.order");
  const tState = useTranslations("state");

  return (
    <div className="space-y-3">
      {showFailedBanner ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
          {tOrder("failed")}
        </div>
      ) : null}
      <ol className="flex flex-col gap-0 sm:flex-row sm:flex-wrap sm:items-center" aria-label="Order timeline">
        {steps.map((s, i) => {
          const label = tOrder(s.status as "created" | "payment_pending" | "paid" | "shipped" | "completed" | "failed");
          const base =
            "relative flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold sm:min-w-0 sm:flex-none";
          const cls =
            s.phase === "done"
              ? `${base} border-emerald-200 bg-emerald-50 text-emerald-900`
              : s.phase === "current"
                ? `${base} border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200`
                : s.phase === "skipped"
                  ? `${base} border-dashed border-slate-300 bg-slate-50 text-slate-500`
                  : `${base} border-slate-200 bg-white text-slate-400`;
          return (
            <li key={`${s.status}-${i}`} className="flex items-center sm:flex-initial">
              <span className={cls}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-[10px] font-bold text-slate-600">
                  {i + 1}
                </span>
                <span>
                  {label}
                  {s.phase === "skipped" ? ` · ${tState("phaseSkipped")}` : null}
                </span>
              </span>
              {i < steps.length - 1 ? (
                <span className="mx-1 hidden h-px w-4 bg-slate-300 sm:block" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
