"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ProductCardImage } from "@/components/shop/ProductCardImage";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: string;
  variants?: Array<{ grossPrice: number }>;
};

const minPrice = (p: Product) => {
  const v = p.variants ?? [];
  if (!v.length) return 0;
  return Math.min(...v.map((x) => Number(x.grossPrice)));
};

function ShopInner() {
  const t = useTranslations("search");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Product[]>([]);

  const type = useMemo(() => {
    const u = searchParams.get("type");
    return u === "tshirt" || u === "hoodie" || u === "mug" ? u : "all";
  }, [searchParams]);

  const setType = useCallback(
    (v: string) => {
      const u = new URLSearchParams(searchParams.toString());
      if (v === "all") u.delete("type");
      else u.set("type", v);
      const q = u.toString();
      router.replace(q ? `/shop?${q}` : "/shop");
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`);
      const json = (await res.json()) as { data?: { items?: Product[] } };
      if (!cancelled) {
        setItems(json.data?.items ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, sort]);

  const filtered = useMemo(
    () => (type === "all" ? items : items.filter((x) => x.type === type)),
    [items, type],
  );

  const typeOptions: Array<{ v: string; label: string }> = [
    { v: "all", label: t("typeAll") },
    { v: "tshirt", label: t("typeTshirt") },
    { v: "hoodie", label: t("typeHoodie") },
    { v: "mug", label: t("typeMug") },
  ];

  return (
    <div className="solid-section py-10">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="solid-card h-fit space-y-5" aria-labelledby="filters-heading">
          <h2 id="filters-heading" className="text-lg font-semibold" data-testid="filters-heading">
            {t("filtersTitle")}
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-indigo-600/0 transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-600/15"
          />
          <div className="space-y-2 text-sm">
            {typeOptions.map((opt) => (
              <label key={opt.v} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                <input checked={type === opt.v} onChange={() => setType(opt.v)} type="radio" name="ptype" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </aside>
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="search-heading">
              {t("title")}
            </h1>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-slate-600">
                {t("sortLabel")}
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
              >
                <option value="name_asc">{t("sortNameAsc")}</option>
                <option value="name_desc">{t("sortNameDesc")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500" role="status">
              {t("resultsLoading")}
            </p>
          ) : null}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`} className="solid-card solid-card-hover block space-y-3 p-4">
                <ProductCardImage slug={item.slug} type={item.type} alt={item.name} />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.type}</p>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
                <p className="text-sm font-bold text-slate-900">
                  {tc("from")} {minPrice(item).toFixed(0)} {tc("pln")}
                </p>
              </Link>
            ))}
          </div>
          {!loading && filtered.length === 0 ? <p className="text-sm text-slate-600">{t("emptyHint")}</p> : null}
        </section>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const tc = useTranslations("common");
  return (
    <Suspense
      fallback={
        <div className="solid-section py-16 text-sm text-slate-500" role="status">
          {tc("loading")}
        </div>
      }
    >
      <ShopInner />
    </Suspense>
  );
}
