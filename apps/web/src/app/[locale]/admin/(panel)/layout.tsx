import { getSessionFromCookie } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionFromCookie();
  if (session === null) {
    redirect({ href: "/admin/login", locale });
  } else if (session.role !== "admin") {
    redirect({ href: "/", locale });
  }
  return <AdminShell>{children}</AdminShell>;
}
