"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductCardImage } from "@/components/shop/ProductCardImage";

type CartItem = {
  id: string;
  quantity: number;
  configuration: {
    product: { id: string; name: string; slug: string; type: string };
    variant: { grossPrice: number; size: string; color: string };
  };
};

export default function CartPage() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await fetch("/api/cart");
      const json = (await res.json()) as { data?: { items?: CartItem[] } };
      setItems(json.data?.items ?? []);
      setLoading(false);
    };
    void run();
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.configuration.variant.grossPrice) * i.quantity, 0),
    [items],
  );

  return (
    <div className="solid-section space-y-8 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4" aria-labelledby="cart-items">
          <h2 id="cart-items" className="sr-only">
            {t("title")}
          </h2>
          {loading ? (
            <div className="space-y-3" role="status">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
              <p className="text-sm text-slate-500">{tc("loading")}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="solid-card grid gap-6 md:grid-cols-[1fr_200px] md:items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{t("emptyTitle")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("emptyBody")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">
                    {t("browseTrending")}
                  </Link>
                  <Link href="/search" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold">
                    {t("browseShop")}
                  </Link>
                </div>
              </div>
              <div className="relative hidden h-40 overflow-hidden rounded-2xl bg-slate-100 md:block" aria-hidden />
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="solid-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <ProductCardImage
                      slug={item.configuration.product.slug}
                      type={item.configuration.product.type}
                      alt={item.configuration.product.name}
                      className="h-24 w-24 shrink-0"
                    />
                    <div>
                      <p className="font-semibold">{item.configuration.product.name}</p>
                      <p className="text-sm text-slate-600">
                        {item.configuration.variant.size} / {item.configuration.variant.color}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {item.quantity} × {Number(item.configuration.variant.grossPrice).toFixed(2)} {tc("pln")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="solid-card h-fit space-y-5">
          <p className="text-lg font-semibold">{t("summaryTitle")}</p>
          <div className="flex justify-between text-sm">
            <span>{t("total")}</span>
            <span className="font-bold">
              {total.toFixed(2)} {tc("pln")}
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{t("deliveryInfoTitle")}</p>
            <p className="mt-2 leading-relaxed">{t("deliveryInfoBody")}</p>
          </div>
          <Link
            href="/checkout"
            className={`block rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm ${
              items.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t("checkout")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
