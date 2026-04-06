import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { blogPosts } from "@/lib/blog-posts";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const t = await getTranslations("blog");

  return (
    <article className="solid-section max-w-3xl space-y-6 py-12">
      <Link href="/blog" className="text-sm font-semibold text-indigo-600">
        ← {t("backToBlog")}
      </Link>
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{t(post.dateKey)}</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t(post.titleKey)}</h1>
      </header>
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-600 leading-relaxed">{t(post.bodyKey as "p1Body" | "p2Body" | "p3Body")}</p>
      </div>
    </article>
  );
}
