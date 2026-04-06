import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function ShopHeader() {
  const t = await getTranslations("nav");

  const linkClass = "text-sm font-medium text-slate-700 transition hover:text-indigo-600";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="solid-section">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
            Solid Shop
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            <Link href="/" className={linkClass}>
              {t("home")}
            </Link>
            <Link href="/search" className={linkClass}>
              {t("shop")}
            </Link>
            <Link href="/products" className={linkClass}>
              {t("products")}
            </Link>
            <Link href="/create" className={linkClass}>
              {t("create")}
            </Link>
            <Link href="/cart" className={linkClass}>
              {t("cart")}
            </Link>
            <Link href="/account" className={linkClass}>
              {t("account")}
            </Link>
            <Link href="/admin" className={linkClass}>
              {t("admin")}
            </Link>
            <Link href="/login" className={linkClass}>
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              {t("register")}
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <LanguageSwitcher />
            <Link href="/cart" className="md:hidden rounded-full border border-slate-200 p-2 text-slate-700" aria-label={t("cart")}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
