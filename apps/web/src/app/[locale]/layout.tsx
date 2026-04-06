import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AppToaster } from "@/components/flow/AppToaster";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Solid Shop — Shirt Project",
  description: "Design-to-product storefront",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "pl" | "en")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 font-sans text-slate-900" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <AppToaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
