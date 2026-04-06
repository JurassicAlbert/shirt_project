"use client";

import { useTranslations } from "next-intl";

type Props = {
  designStatus: string | null;
  aiJobStatus: string | null;
  isWorking: boolean;
};

function jobSimpleLabel(
  tj: (key: "waiting" | "active" | "completed" | "failed" | "dead_letter") => string,
  status: string,
): string {
  if (status === "waiting") return tj("waiting");
  if (status === "active") return tj("active");
  if (status === "completed") return tj("completed");
  if (status === "dead_letter") return tj("dead_letter");
  if (status === "failed") return tj("failed");
  return tj("active");
}

/**
 * Maps design + BullMQ job state to three user-facing generation stages (queue → processing → ready).
 */
export function CreateFlowStages({ designStatus, aiJobStatus, isWorking }: Props) {
  const t = useTranslations("create");
  const tj = useTranslations("state.jobSimple");

  const stageIndex = (() => {
    if (designStatus === "completed" || designStatus === "moderated") return 3;
    if (designStatus === "failed") return -1;
    if (designStatus === "pending") {
      if (aiJobStatus === "waiting") return 1;
      if (aiJobStatus === "active") return 2;
      if (aiJobStatus === "completed") return 2;
      if (aiJobStatus === "failed" || aiJobStatus === "dead_letter") return -1;
      return isWorking ? 2 : 1;
    }
    return 0;
  })();

  const steps = [
    { id: "queued", label: t("stageQueued"), n: 1 },
    { id: "gen", label: t("stageGenerating"), n: 2 },
    { id: "ready", label: t("stageReady"), n: 3 },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4" data-testid="create-flow-stages">
      <p className="text-sm font-semibold text-indigo-900">{t("flowTitle")}</p>
      <p className="text-xs text-indigo-800/80">{t("estimatedHint")}</p>
      <ol className="space-y-2">
        {steps.map((s) => {
          const done = stageIndex > s.n;
          const active = stageIndex === s.n;
          const pending = stageIndex >= 0 && stageIndex < s.n;
          return (
            <li
              key={s.id}
              data-testid={active ? `create-flow-active-${s.id}` : undefined}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium ${
                done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : active
                    ? "border-indigo-500 bg-white text-indigo-900 ring-2 ring-indigo-200"
                    : "border-slate-200 bg-white/60 text-slate-500"
              } ${pending ? "opacity-70" : ""}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm">
                {s.n}
              </span>
              <span>{s.label}</span>
              {active ? (
                <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-indigo-500" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
      {aiJobStatus ? (
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{t("jobLabel")}: </span>
          {jobSimpleLabel(tj, aiJobStatus)}
        </p>
      ) : null}
    </div>
  );
}
