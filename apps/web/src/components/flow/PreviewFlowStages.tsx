"use client";

import { useTranslations } from "next-intl";

type Props = {
  previewJobStatus: string | null;
  hasImage: boolean;
  isPolling: boolean;
};

export function PreviewFlowStages({ previewJobStatus, hasImage, isPolling }: Props) {
  const t = useTranslations("create");
  const tj = useTranslations("state.jobSimple");

  const stage = hasImage ? 3 : previewJobStatus === "active" ? 2 : previewJobStatus === "waiting" && isPolling ? 1 : isPolling ? 2 : 0;

  const steps = [
    { id: "pq", label: t("previewStageQueued"), n: 1 },
    { id: "pr", label: t("previewStageRunning"), n: 2 },
    { id: "pd", label: t("previewStageReady"), n: 3 },
  ];

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs" data-testid="preview-flow-stages">
      <p className="font-semibold text-slate-800">{t("previewTitle")}</p>
      <ol className="space-y-1">
        {steps.map((s) => {
          const done = stage > s.n;
          const active = stage === s.n;
          return (
            <li
              key={s.id}
              data-testid={active ? `preview-flow-${s.id}` : undefined}
              className={`rounded-lg px-2 py-1 ${done ? "text-emerald-700" : active ? "font-semibold text-indigo-700" : "text-slate-400"}`}
            >
              {s.n}. {s.label}
            </li>
          );
        })}
      </ol>
      {previewJobStatus ? (
        <p className="text-slate-600">
          {t("jobLabel")}:{" "}
          {previewJobStatus === "waiting"
            ? tj("waiting")
            : previewJobStatus === "active"
              ? tj("active")
              : previewJobStatus === "completed"
                ? tj("completed")
                : previewJobStatus === "dead_letter"
                  ? tj("dead_letter")
                  : tj("failed")}
        </p>
      ) : null}
    </div>
  );
}
