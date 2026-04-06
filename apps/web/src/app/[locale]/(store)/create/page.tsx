"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { CreateFlowStages } from "@/components/flow/CreateFlowStages";
import { FlowErrorPanel } from "@/components/flow/FlowErrorPanel";
import { PreviewFlowStages } from "@/components/flow/PreviewFlowStages";

type Design = { id: string; status: string; imageUrl?: string | null; errorMessage?: string | null };

export default function CreatePage() {
  const t = useTranslations("create");
  const tc = useTranslations("common");
  const [prompt, setPrompt] = useState("");
  const [design, setDesign] = useState<Design | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [aiJobStatus, setAiJobStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [textOverlay, setTextOverlay] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [previewJobStatus, setPreviewJobStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");

  const examples = [t("ex1"), t("ex2"), t("ex3")];
  const toastDoneRef = useRef(false);

  const isAiWorking = submitting || design?.status === "pending";

  useEffect(() => {
    if (!design?.id || design.status === "completed" || design.status === "failed" || design.status === "moderated") {
      return;
    }
    const tick = async () => {
      try {
        const dRes = await fetch(`/api/designs/${design.id}`);
        const dJson = (await dRes.json()) as { data?: Design };
        const d = dJson.data;
        if (d) {
          setDesign((prev) => (prev?.id === d.id ? { ...prev, ...d } : d));
          if (d.status === "completed" && !toastDoneRef.current) {
            toastDoneRef.current = true;
            toast.success(t("stageReady"));
          }
          if (d.status === "failed" && !toastDoneRef.current) {
            toastDoneRef.current = true;
            toast.error(t("stageFailed"));
          }
        }
        if (jobId) {
          const jRes = await fetch(`/api/jobs/${jobId}`);
          const jJson = (await jRes.json()) as { data?: { status?: string } };
          if (jJson.data?.status) setAiJobStatus(jJson.data.status);
        }
      } catch {
        /* ignore transient network */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 2000);
    return () => clearInterval(id);
  }, [design?.id, design?.status, jobId, t]);

  useEffect(() => {
    if (!previewJobId) return;
    const tick = async () => {
      try {
        const jRes = await fetch(`/api/jobs/${previewJobId}`);
        const jJson = (await jRes.json()) as {
          data?: { status?: string; result?: { previewImageUrl?: string } };
        };
        const st = jJson.data?.status;
        if (st) setPreviewJobStatus(st);
        if (jJson.data?.status === "completed" && jJson.data.result?.previewImageUrl) {
          setPreviewUrl(jJson.data.result.previewImageUrl);
          toast.success(t("previewStageReady"));
          setPreviewJobId(null);
        }
        if (jJson.data?.status === "dead_letter") {
          setPreviewError(t("errJob"));
          toast.error(t("errJob"));
          setPreviewJobId(null);
        }
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 2000);
    return () => clearInterval(id);
  }, [previewJobId, t]);

  const generate = async () => {
    toastDoneRef.current = false;
    setSubmitting(true);
    setError("");
    setPreviewUrl("");
    setPreviewJobId(null);
    setPreviewJobStatus(null);
    setAiJobStatus(null);
    const res = await fetch("/api/designs/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, productType: "tshirt" }),
    });
    const json = (await res.json()) as { data?: { id: string; jobId: string } };
    if (!res.ok || !json.data) {
      setError(t("errGen"));
      toast.error(t("errGen"));
      setSubmitting(false);
      return;
    }
    setDesign({ id: json.data.id, status: "pending" });
    setJobId(json.data.jobId);
    setSubmitting(false);
    toast.info(t("stageQueued"));
  };

  const retryFromFailure = () => {
    toastDoneRef.current = false;
    setDesign(null);
    setJobId(null);
    setAiJobStatus(null);
    setError("");
    void generate();
  };

  const makePreview = async () => {
    if (!design?.id) return;
    setPreviewError("");
    setPreviewUrl("");
    setPreviewJobId(null);
    setPreviewJobStatus(null);
    const products = await fetch("/api/products").then(
      (r) => r.json() as Promise<{ data?: { items?: Array<{ id: string; variants: Array<{ id: string }> }> } }>,
    );
    const p = products.data?.items?.[0];
    const v = p?.variants?.[0];
    if (!p || !v) return;

    const res = await fetch("/api/previews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id, variantId: v.id, designId: design.id, textOverlay }),
    });
    const json = (await res.json()) as { data?: { status?: string; jobId?: string; previewImageUrl?: string } };
    if (!res.ok) {
      setPreviewError(t("errPreview"));
      toast.error(t("errPreview"));
      return;
    }
    if (json.data?.previewImageUrl) {
      setPreviewUrl(json.data.previewImageUrl);
      toast.success(t("previewStageReady"));
      return;
    }
    const jid = json.data?.jobId;
    if (jid) {
      setPreviewJobId(jid);
      toast.info(t("previewStageQueued"));
    }
  };

  const showAiFailure = design?.status === "failed" || aiJobStatus === "dead_letter" || aiJobStatus === "failed";

  return (
    <div className="solid-section space-y-10 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
        <p className="text-sm text-slate-600">
          <Link href="/shop" className="font-semibold text-indigo-600">
            {tc("back")}
          </Link>
        </p>
      </div>

      {(design || submitting) && (
        <CreateFlowStages designStatus={design?.status ?? null} aiJobStatus={aiJobStatus} isWorking={isAiWorking} />
      )}

      <div className="solid-card space-y-4">
        <textarea
          data-testid="create-prompt"
          className="min-h-32 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-600/15"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("promptPlaceholder")}
        />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">{t("examplesTitle")}</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          data-testid="create-generate-btn"
          onClick={generate}
          disabled={!prompt || isAiWorking}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isAiWorking ? t("generating") : t("generate")}
        </button>
      </div>

      {showAiFailure ? (
        <FlowErrorPanel
          message={design?.errorMessage ?? t("stageFailed")}
          onRetry={prompt ? retryFromFailure : undefined}
          retryLabel={t("retryGenerate")}
        />
      ) : null}

      {error && !showAiFailure ? <FlowErrorPanel message={error} onRetry={retryFromFailure} retryLabel={t("retryGenerate")} /> : null}

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("resultsTitle")}</h2>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="solid-card space-y-2">
            <p className="text-sm font-semibold">{t("jobLabel")}</p>
            <p className="font-mono text-xs text-slate-600">{jobId ?? "—"}</p>
            <p className="text-sm text-slate-600">
              {t("statusLabel")}: {design?.status ?? t("idle")}
            </p>
            {design?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={design.imageUrl} alt="" className="mt-2 h-40 w-full rounded-xl object-cover" />
            ) : (
              <div
                className={`mt-2 h-40 rounded-xl bg-slate-100 ${isAiWorking ? "animate-pulse" : ""}`}
                role="status"
                aria-label={tc("loading")}
              />
            )}
          </div>
          <div className="solid-card space-y-3">
            <p className="text-sm font-semibold">{t("overlayTitle")}</p>
            <input
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder={t("overlayPlaceholder")}
            />
            <button
              type="button"
              data-testid="create-preview-btn"
              onClick={makePreview}
              disabled={!design?.id || (design.status !== "completed" && design.status !== "moderated")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {t("previewBtn")}
            </button>
          </div>
          <div className="solid-card space-y-2">
            <PreviewFlowStages
              previewJobStatus={previewJobStatus}
              hasImage={!!previewUrl}
              isPolling={!!previewJobId}
            />
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-52 w-full rounded-xl object-cover" data-testid="create-preview-image" />
            ) : (
              <div className={`h-52 rounded-xl bg-slate-100 ${previewJobId ? "animate-pulse" : ""}`} />
            )}
          </div>
        </div>
      </div>
      {previewError ? <FlowErrorPanel message={previewError} onRetry={makePreview} retryLabel={tc("retry")} /> : null}
    </div>
  );
}
