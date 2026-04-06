"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { productImageUrl } from "@/lib/catalog-images";
import { toast } from "sonner";

type Variant = { id: string; size: string; color: string; material: string; grossPrice: number };
type Product = { id: string; name: string; slug: string; description?: string | null; type: string; variants: Variant[] };

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      const p = await params;
      setLoading(true);
      const res = await fetch(`/api/products/${p.id}`);
      const json = (await res.json()) as { data?: Product };
      const data = json.data ?? null;
      setProduct(data);
      setVariantId(data?.variants?.[0]?.id ?? "");
      setLoading(false);
    };
    void run();
  }, [params]);

  const selected = useMemo(
    () => product?.variants.find((v) => v.id === variantId) ?? product?.variants[0],
    [product, variantId],
  );

  const imgSrc = product ? productImageUrl(product.slug, product.type) : "";

  const addToCart = async () => {
    if (!product || !variantId) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, variantId, quantity: 1 }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg(t("addedOk"));
      toast.success(tt("cartAdded"));
    } else {
      setMsg(t("addedFail"));
      toast.error(tt("error"));
    }
  };

  if (loading) {
    return (
      <div className="solid-section py-16" role="status">
        <div className="solid-card h-96 animate-pulse bg-slate-100" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="solid-section py-16 text-sm text-slate-600">
        <Link href="/search" className="font-semibold text-indigo-600">
          {tc("back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="solid-section py-10">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="solid-card overflow-hidden p-4">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100">
            <Image src={imgSrc} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          </div>
        </div>
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{product.type}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t("descTitle")}</h2>
            <p className="mt-2 text-slate-600">{product.description}</p>
          </div>
          <div className="solid-card space-y-3">
            <p className="text-sm font-semibold">{t("variantTitle")}</p>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size} / {v.color} / {v.material}
                </option>
              ))}
            </select>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {Number(selected?.grossPrice ?? 0).toFixed(2)} {tc("pln")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addToCart}
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {busy ? t("adding") : t("addToCart")}
            </button>
            <Link href="/create" className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold shadow-sm">
              {t("createDesign")}
            </Link>
          </div>
          {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <h2 className="text-sm font-semibold text-slate-900">{t("deliveryTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("deliveryBody")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
