import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCardImage } from "@/components/shop/ProductCardImage";
import { productRepository } from "@/lib/repositories";

export default async function ProductsPage() {
  const t = await getTranslations("products");
  const tc = await getTranslations("common");
  const items = await productRepository.list();

  return (
    <div className="solid-section space-y-8 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={`/products/${item.id}`} className="solid-card solid-card-hover block space-y-3 p-4">
            <ProductCardImage slug={item.slug} type={item.type} alt={item.name} />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.type}</p>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
            <p className="text-sm font-bold text-slate-900">
              {tc("from")} {Number(item.variants[0]?.grossPrice ?? 0).toFixed(0)} {tc("pln")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
