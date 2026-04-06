import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogPosts } from "@/lib/blog-posts";

export default async function BlogPage() {
  const t = await getTranslations("blog");

  return (
    <div className="solid-section space-y-10 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="max-w-2xl text-slate-600">{t("subtitle")}</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="solid-card solid-card-hover block space-y-3 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{t(p.dateKey)}</p>
            <h2 className="text-lg font-semibold leading-snug">{t(p.titleKey)}</h2>
            <p className="line-clamp-3 text-sm text-slate-600">{t(p.excerptKey)}</p>
            <span className="text-sm font-semibold text-indigo-600">{t("readMore")} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
