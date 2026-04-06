"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Order = { id: string; status: string; totalGross: number; createdAt: string };

export default function AccountPage() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await fetch("/api/account/orders");
      const json = (await res.json()) as { data?: { items?: Order[] } };
      setOrders(json.data?.items ?? []);
      setLoading(false);
    };
    void run();
  }, []);

  return (
    <div className="solid-section space-y-10 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="solid-card space-y-4" aria-labelledby="orders-h">
          <h2 id="orders-h" className="text-lg font-semibold">
            {t("ordersTitle")}
          </h2>
          {loading ? (
            <div className="space-y-3" role="status" aria-busy>
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
              <p className="text-sm text-slate-500">{tc("loading")}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
              <p>{t("noOrders")}</p>
              <Link href="/shop" className="mt-3 inline-block font-semibold text-indigo-600">
                {t("shopCta")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                  <p className="font-mono text-xs text-slate-500">{o.id}</p>
                  <p className="mt-1 font-medium text-slate-800">{t("ordersTitle")}: {o.status}</p>
                  <p className="text-slate-600">
                    {Number(o.totalGross).toFixed(2)} {tc("pln")}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleString()}</p>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="mt-3 inline-flex text-sm font-semibold text-indigo-600"
                    data-testid={`account-order-link-${o.id.slice(0, 8)}`}
                  >
                    {t("viewOrder")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="solid-card space-y-4" aria-labelledby="returns-h">
          <h2 id="returns-h" className="text-lg font-semibold">
            {t("returnsTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">{t("returnsBody")}</p>
          <Link href="/shop" className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
            {t("returnsCta")}
          </Link>
        </section>
      </div>
    </div>
  );
}
