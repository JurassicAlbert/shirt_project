import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ProductCardImage } from "@/components/shop/ProductCardImage";
import { productRepository } from "@/lib/repositories";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const items = await productRepository.list();
  const trending = [...items].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 8);

  return (
    <div className="space-y-20 py-12">
      <section className="solid-section" aria-labelledby="hero-heading">
        <div className="solid-card grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t("heroBadge")}</p>
            <h1 id="hero-heading" className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">{t("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                data-testid="hero-cta-search"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                {t("heroCtaPrimary")}
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300"
              >
                {t("heroCtaSecondary")}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1618354691373-d851c43c9772?w=600&q=80"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="solid-section space-y-8" aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("categoriesTitle")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { href: "/search?type=tshirt", title: t("catTshirtTitle"), desc: t("catTshirtDesc"), img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80" },
            { href: "/search?type=hoodie", title: t("catHoodieTitle"), desc: t("catHoodieDesc"), img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80" },
            { href: "/search?type=mug", title: t("catMugTitle"), desc: t("catMugDesc"), img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="solid-card group block overflow-hidden p-0">
              <div className="relative h-48 w-full">
                <Image src={c.img} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="33vw" />
              </div>
              <div className="space-y-2 p-6">
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="text-sm text-slate-600">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="solid-section space-y-8" aria-labelledby="trend-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="trend-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("trendingTitle")}
          </h2>
          <Link href="/search" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            {tc("viewAll")}
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((item) => (
            <Link key={item.id} href={`/products/${item.id}`} className="solid-card block space-y-3 p-4 transition hover:shadow-md">
              <ProductCardImage slug={item.slug} type={item.type} alt={item.name} />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.type}</p>
              <h3 className="font-semibold leading-snug">{item.name}</h3>
              <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
              <p className="text-sm font-bold text-slate-900">
                {tc("from")} {Number(item.variants[0]?.grossPrice ?? 0).toFixed(0)} {tc("pln")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="solid-section space-y-8" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
          {t("howTitle")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "01", title: t("howStep1Title"), body: t("howStep1Body") },
            { step: "02", title: t("howStep2Title"), body: t("howStep2Body") },
            { step: "03", title: t("howStep3Title"), body: t("howStep3Body") },
          ].map((s) => (
            <div key={s.step} className="solid-card relative overflow-hidden">
              <span className="text-5xl font-black text-indigo-100">{s.step}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="solid-section space-y-8" aria-labelledby="reviews-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
            {t("reviewsTitle")}
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center shadow-sm">
            <p className="text-3xl font-bold text-indigo-600">4.9</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("ratingLabel")}</p>
            <p className="mt-1 text-amber-400" aria-hidden>
              ★★★★★
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { quote: t("review1"), author: t("review1Author"), role: t("review1Role") },
            { quote: t("review2"), author: t("review2Author"), role: t("review2Role") },
            { quote: t("review3"), author: t("review3Author"), role: t("review3Role") },
          ].map((r, i) => (
            <blockquote key={i} className="solid-card space-y-3">
              <p className="text-sm leading-relaxed text-slate-700">&ldquo;{r.quote}&rdquo;</p>
              <footer className="text-sm">
                <cite className="not-italic font-semibold text-slate-900">{r.author}</cite>
                <span className="text-slate-500"> — {r.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="solid-section pb-6">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-8 py-12 text-center text-white shadow-xl shadow-indigo-900/20 md:px-16">
          <h2 className="text-2xl font-bold md:text-3xl">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">{t("ctaSubtitle")}</p>
          <Link
            href="/search"
            className="mt-8 inline-flex rounded-xl bg-white px-8 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
