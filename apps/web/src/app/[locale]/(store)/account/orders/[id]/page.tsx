"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OrderTimelineStrip, type TimelineStepVm } from "@/components/flow/OrderTimelineStrip";

type Transition = {
  id: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
  actor?: string | null;
  reason?: string | null;
};

type Detail = {
  order: { id: string; status: string; totalGross: number; createdAt: string };
  transitions: Transition[];
  timeline: TimelineStepVm[];
  nextStatuses: string[];
};

function nextHintText(next: string[], t: (key: string) => string): string {
  if (!next.length) return t("nextHint.none");
  const x = next[0];
  switch (x) {
    case "created":
      return t("nextHint.created");
    case "payment_pending":
      return t("nextHint.payment_pending");
    case "paid":
      return t("nextHint.paid");
    case "shipped":
      return t("nextHint.shipped");
    case "completed":
      return t("nextHint.completed");
    case "failed":
      return t("nextHint.failed");
    default:
      return t("nextHint.none");
  }
}

export default function AccountOrderDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const tOrder = useTranslations("state.order");
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await fetch(`/api/account/orders/${id}`);
      const json = (await res.json()) as { ok?: boolean; data?: Detail };
      if (!res.ok || !json.data) {
        setErr("not_found");
        setData(null);
      } else {
        setData(json.data);
        setErr("");
      }
      setLoading(false);
    };
    if (id) void run();
  }, [id, tc]);

  if (loading) {
    return (
      <div className="solid-section space-y-4 py-10" role="status">
        <div className="h-10 max-w-md animate-pulse rounded-xl bg-slate-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="solid-section space-y-4 py-10 text-sm text-slate-600">
        <Link href="/account" className="font-semibold text-indigo-600">
          {t("backToOrders")}
        </Link>
        {err ? <p>{t("orderNotFound")}</p> : null}
      </div>
    );
  }

  const failed = data.order.status === "failed";

  return (
    <div className="solid-section space-y-8 py-10">
      <div>
        <Link href="/account" className="text-sm font-semibold text-indigo-600">
          ← {t("backToOrders")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{t("orderProgress")}</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">{data.order.id}</p>
        <p className="mt-2 text-sm text-slate-600">
          {tOrder(data.order.status as "created" | "payment_pending" | "paid" | "shipped" | "completed" | "failed")} ·{" "}
          {Number(data.order.totalGross).toFixed(2)} {tc("pln")}
        </p>
      </div>

      <section className="solid-card space-y-4" aria-labelledby="tl">
        <h2 id="tl" className="text-lg font-semibold">
          {t("orderProgress")}
        </h2>
        <OrderTimelineStrip steps={data.timeline} showFailedBanner={failed} />
      </section>

      <section className="solid-card space-y-3" aria-labelledby="hist">
        <h2 id="hist" className="text-lg font-semibold">
          {t("orderHistory")}
        </h2>
        {data.transitions.length === 0 ? (
          <p className="text-sm text-slate-600">{t("historyEmpty")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.transitions.map((tr) => (
              <li key={tr.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <span className="font-medium text-slate-800">
                  {tOrder(tr.fromStatus as "created" | "payment_pending" | "paid" | "shipped" | "completed" | "failed")} →{" "}
                  {tOrder(tr.toStatus as "created" | "payment_pending" | "paid" | "shipped" | "completed" | "failed")}
                </span>
                <span className="mt-1 block text-xs text-slate-500">{new Date(tr.createdAt).toLocaleString()}</span>
                {tr.reason ? <span className="mt-1 block text-xs text-slate-600">{tr.reason}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="solid-card space-y-2" aria-labelledby="next">
        <h2 id="next" className="text-lg font-semibold">
          {t("whatNext")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-700">{nextHintText(data.nextStatuses, t)}</p>
        {!failed && data.nextStatuses.includes("payment_pending") ? (
          <Link href="/checkout" className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            {tc("next")}
          </Link>
        ) : null}
      </section>
    </div>
  );
}
