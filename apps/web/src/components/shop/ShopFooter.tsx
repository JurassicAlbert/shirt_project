import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function ShopFooter() {
  const t = await getTranslations("footer");
  const n = await getTranslations("nav");

  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="solid-section py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="text-lg font-semibold text-white">Solid Shop</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed">{t("tagline")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{n("shop")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/search" className="hover:text-white">
                  {n("shop")}
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white">
                  {n("products")}
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-white">
                  {n("create")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{n("account")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/account" className="hover:text-white">
                  {n("account")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  {n("login")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  {n("register")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Solid Shop — {t("rights")}
        </p>
      </div>
    </footer>
  );
}
